let currentState = 'LOW_FATIGUE';
let stateLockUntil = 0;
let userOverrideUntil = 0;
let lastBreakTime = 0;
let manualOverrides = { font: false, brightness: false, focus: false };

let potentialState = 'LOW_FATIGUE';
let potentialStateStart = 0;
let highFatigueStart = 0;

let creatingOffscreen;
async function playAudioOffscreen() {
    try {
        const hasDoc = await chrome.offscreen.hasDocument();
        if (!hasDoc) {
            if (creatingOffscreen) {
                await creatingOffscreen;
            } else {
                creatingOffscreen = chrome.offscreen.createDocument({
                    url: 'offscreen.html',
                    reasons: ['AUDIO_PLAYBACK'],
                    justification: 'Play critical fatigue warning beep'
                });
                await creatingOffscreen;
                creatingOffscreen = null;
            }
        }
        chrome.runtime.sendMessage({ type: 'PLAY_BEEP' }).catch(() => { });
    } catch (e) { console.error("Offscreen audio failed", e); }
}

let systemActive = false;

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        fatigueScore: 0,
        privacyMode: false,
        activeState: 'LOW_FATIGUE',
        systemActive: false
    });
});

function getTargetState(score) {
    if (score <= 25) return 'LOW_FATIGUE';
    if (score <= 50) return 'MEDIUM_FATIGUE';
    if (score <= 75) return 'HIGH_FATIGUE';
    return 'CRITICAL_FATIGUE';
}

function processScore(score) {
    if (!systemActive) return;
    const now = Date.now();
    const targetState = getTargetState(score);

    // 3-second confirmation logic
    if (targetState !== potentialState) {
        potentialState = targetState;
        potentialStateStart = now;
    } else if (targetState !== currentState && (now - potentialStateStart) >= 800) {
        // We've held the new state for 800ms continuously

        // Check 3-second stability lock and user override lock
        if (now > stateLockUntil && now > userOverrideUntil) {
            currentState = targetState;
            stateLockUntil = now + 1000; // 1 second lock stability
            chrome.storage.local.set({ activeState: currentState });

            broadcastStateChange();

            // Trigger notification immediately on changing to a dangerous state
            if (currentState === 'HIGH_FATIGUE' || currentState === 'CRITICAL_FATIGUE') {
                if (now - lastBreakTime >= (60 * 1000)) {
                    lastBreakTime = now;
                    broadcastBreak();
                }
            }
        }
    }

    // CONTINUOUS CHECK: Regardless of whether the state just changed or not, 
    // if the user is currently IN a dangerous state, trigger the break notification periodically.
    if ((currentState === 'HIGH_FATIGUE' || currentState === 'CRITICAL_FATIGUE')
        && now > userOverrideUntil
        && now - lastBreakTime >= (60 * 1000)) {

        lastBreakTime = now;
        broadcastBreak();
    }
}

function broadcastStateChange(score) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                type: 'APPLY_FATIGUE_ADAPTATION',
                state: currentState,
                score: (typeof score === 'number' && !isNaN(score)) ? score : null
            }).catch(() => { });
        });
    });
}

function broadcastBreak() {
    if (!systemActive) return;
    playAudioOffscreen();

    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'logo.png',
        title: '⚠️ CRITICAL FATIGUE ESTIMATED',
        message: 'Your estimated cognitive load is elevated. Please take a short break to rest your eyes!',
        priority: 2,
        requireInteraction: true
    });

    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { type: 'SHOW_BREAK_BANNER' }).catch(() => { });
        });
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_FATIGUE_SCORE') {
        const score = message.score;
        chrome.storage.local.set({ fatigueScore: score });
        processScore(score);

        // Async sync to backend API
        fetch('http://localhost:3001/api/extension/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score, activeState: currentState })
        }).catch(() => { });

        // Relay behavioral data to dashboard
        if (message.behaviorData) {
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'BIO_ADAPTIVE_BEHAVIOR_REPORT',
                        behaviorData: message.behaviorData
                    }).catch(() => { });
                });
            });
        }

        // Also broadcast the updated score specifically for the dashboard UI
        broadcastStateChange(score);

        sendResponse({ success: true, activeState: currentState });
        return true; // Keep channel open for async query
    }

    if (message.type === 'START_SYSTEM') {
        systemActive = true;
        chrome.storage.local.set({ systemActive: true });
        broadcastSystemStateSync(true);
        sendResponse({ success: true });
    }

    if (message.type === 'STOP_SYSTEM') {
        systemActive = false;
        currentState = 'LOW_FATIGUE';
        chrome.storage.local.set({ systemActive: false, fatigueScore: 0, activeState: 'LOW_FATIGUE' });
        broadcastSystemStateSync(false);
        broadcastStateChange(0); // Reset all tabs
        sendResponse({ success: true });
    }

    if (message.type === 'USER_OVERRIDE') {
        userOverrideUntil = Date.now() + 3000; // 3 seconds for testing
        currentState = 'LOW_FATIGUE';
        chrome.storage.local.set({ activeState: currentState });
        broadcastStateChange();
        sendResponse({ success: true });
    }

    if (message.type === 'TOGGLE_PRIVACY_MODE') {
        chrome.storage.local.set({ privacyMode: message.privacyMode });
        broadcastPrivacyChange(message.privacyMode);
        sendResponse({ success: true });
    }

    if (message.type === 'MANUAL_OVERRIDE_TOGGLE') {
        manualOverrides[message.overrideType] = message.value;
        broadcastManualOverrides();
        sendResponse({ success: true });
    }

    if (message.type === 'GET_CURRENT_STATE') {
        chrome.storage.local.get(['privacyMode', 'fatigueScore', 'systemActive'], (res) => {
            sendResponse({
                state: currentState,
                privacyMode: res.privacyMode || false,
                score: res.fatigueScore || 0,
                systemActive: systemActive,
                manualOverrides: manualOverrides
            });
        });
        return true;
    }

    return true; // Keep channel open
});

function broadcastPrivacyChange(isPrivacy) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                type: 'BIO_ADAPTIVE_PRIVACY_TOGGLE_CHANGED',
                privacyMode: isPrivacy
            }).catch(() => { });
        });
    });
}

function broadcastSystemStateSync(isActive) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                type: 'SYSTEM_STATE_CHANGED',
                systemActive: isActive
            }).catch(() => { });
        });
    });
}

function broadcastManualOverrides() {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                type: 'MANUAL_OVERRIDE_SYNC',
                manualOverrides: manualOverrides
            }).catch(() => { });
        });
    });
}
