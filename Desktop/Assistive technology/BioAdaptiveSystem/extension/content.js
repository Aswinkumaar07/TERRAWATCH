// Bio-Adaptive Content Script
// 1. Listens for PostMessage from the main web application (if on the dashboard page)
// 2. Receives broadcasted scores from background script and applies CSS/DOM changes

// --- PART 1: Broadcast interception (for the Web App tab) ---
let isSystemActive = false;
let manualOverrides = { font: false, brightness: false, focus: false };
let currentFatigueState = 'LOW_FATIGUE';
window.addEventListener('message', (event) => {
    // Only accept messages with the proper type
    if (event.data && event.data.type === 'BIO_ADAPTIVE_STATE') {
        // Send ACK back to the web app
        window.postMessage({ type: 'BIO_ADAPTIVE_ACK', timestamp: Date.now() }, '*');

        // Verify extension context is still valid before sending
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
            try {
                chrome.runtime.sendMessage({
                    type: 'UPDATE_FATIGUE_SCORE',
                    score: event.data.fatigueScore
                }).catch(() => { }); // Silence unhandled promise rejections
            } catch (err) { }
        }
    } else if (event.data && event.data.type === 'BIO_ADAPTIVE_PRIVACY_TOGGLE') {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
            try {
                chrome.runtime.sendMessage({
                    type: 'TOGGLE_PRIVACY_MODE',
                    privacyMode: event.data.privacyMode
                }).catch(() => { });
            } catch (err) { }
        }
    } else if (event.data && event.data.type === 'BIO_ADAPTIVE_START_SYSTEM') {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
            chrome.runtime.sendMessage({ type: 'START_SYSTEM' }).catch(() => { });
        }
    } else if (event.data && event.data.type === 'BIO_ADAPTIVE_STOP_SYSTEM') {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
            chrome.runtime.sendMessage({ type: 'STOP_SYSTEM' }).catch(() => { });
        }
    } else if (event.data && event.data.type === 'BIO_ADAPTIVE_MANUAL_TOGGLE') {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
            chrome.runtime.sendMessage({
                type: 'MANUAL_OVERRIDE_TOGGLE',
                overrideType: event.data.overrideType,
                value: event.data.value
            }).catch(() => { });
        }
    }
});

// --- PART 2: Adaptation Engine (for ALL tabs) ---
// Listen for updates from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'APPLY_FATIGUE_ADAPTATION') {
        applyAdaptations(message.state);
        // Relay to window if it's the dashboard
        window.postMessage({
            type: 'BIO_ADAPTIVE_STATE_UPDATE',
            fatigueScore: message.score,
            state: message.state
        }, '*');
        sendResponse({ success: true });
    }
    if (message.type === 'SHOW_BREAK_BANNER') {
        showBreakBanner();
    }
    if (message.type === 'BIO_ADAPTIVE_BEHAVIOR_REPORT') {
        // Relay behavioral data to the dashboard window
        window.postMessage({
            type: 'BIO_ADAPTIVE_BEHAVIOR_REPORT',
            behaviorData: message.behaviorData
        }, '*');
    }
    if (message.type === 'BIO_ADAPTIVE_PRIVACY_TOGGLE_CHANGED') {
        // Relay privacy toggle sync to dashboard window
        window.postMessage({
            type: 'BIO_ADAPTIVE_PRIVACY_SYNC',
            privacyMode: message.privacyMode
        }, '*');

        // Ensure tracking reacts
        if (message.privacyMode && isSystemActive) startBehavioralTracking();
        else {
            stopBehavioralTracking();
        }
    }

    if (message.type === 'SYSTEM_STATE_CHANGED') {
        isSystemActive = message.systemActive;
        if (isSystemActive) {
            chrome.storage.local.get(['privacyMode'], (res) => {
                if (res.privacyMode) startBehavioralTracking();
            });
        } else {
            stopBehavioralTracking();
            applyAdaptations('LOW_FATIGUE'); // Force clear adaptations
        }
    }

    if (message.type === 'MANUAL_OVERRIDE_SYNC') {
        manualOverrides = message.manualOverrides;
        applyAdaptations(currentFatigueState);
        // Relay to dashboard if needed
        window.postMessage({
            type: 'BIO_ADAPTIVE_MANUAL_SYNC',
            manualOverrides: manualOverrides
        }, '*');
    }
});

// Initialize on load
chrome.runtime.sendMessage({ type: 'GET_CURRENT_STATE' }, (res) => {
    if (res && res.state) {
        isSystemActive = res.systemActive || false;
        manualOverrides = res.manualOverrides || manualOverrides;
        currentFatigueState = res.state;

        if (isSystemActive) {
            applyAdaptations(res.state);
        } else {
            applyAdaptations('LOW_FATIGUE');
        }

        // Sync with dashboard window
        window.postMessage({
            type: 'BIO_ADAPTIVE_PRIVACY_SYNC',
            privacyMode: res.privacyMode,
            systemActive: res.systemActive
        }, '*');

        window.postMessage({
            type: 'BIO_ADAPTIVE_STATE_UPDATE',
            fatigueScore: isSystemActive ? res.score : 0,
            state: isSystemActive ? res.state : 'LOW_FATIGUE'
        }, '*');

        window.postMessage({
            type: 'BIO_ADAPTIVE_MANUAL_SYNC',
            manualOverrides: manualOverrides
        }, '*');
    }
});

chrome.storage.local.get(['privacyMode', 'systemActive'], (result) => {
    isSystemActive = result.systemActive || false;
    if (result.privacyMode && isSystemActive) startBehavioralTracking();
});

// The Adaptation Logic
let breakBannerEl = null;

function applyAdaptations(state) {
    currentFatigueState = state;
    const html = document.documentElement;
    if (!html.classList.contains('bio-adaptive-initialized')) {
        html.classList.add('bio-adaptive-initialized');
    }

    // Remove all classes first to reset state cleanly
    html.classList.remove(
        'bio-adaptive-medium-font',
        'bio-adaptive-large-font',
        'bio-adaptive-reduced-motion',
        'bio-adaptive-focus-mode',
        'bio-adaptive-strict-focus',
        'bio-adaptive-brightness-override'
    );
    removeBreakBanner();

    // 1. Fatigue Based Adaptations
    if (state === 'LOW_FATIGUE') {
        // Do nothing
    } else if (state === 'MEDIUM_FATIGUE') {
        html.classList.add('bio-adaptive-medium-font', 'bio-adaptive-reduced-motion');
    } else if (state === 'HIGH_FATIGUE') {
        html.classList.add('bio-adaptive-large-font', 'bio-adaptive-reduced-motion', 'bio-adaptive-focus-mode');
    } else if (state === 'CRITICAL_FATIGUE') {
        html.classList.add('bio-adaptive-large-font', 'bio-adaptive-reduced-motion', 'bio-adaptive-strict-focus');
    }

    // 2. Manual Overrides (Apply on top or override)
    if (manualOverrides.font) {
        html.classList.remove('bio-adaptive-medium-font');
        html.classList.add('bio-adaptive-large-font');
    }
    if (manualOverrides.brightness) {
        html.classList.add('bio-adaptive-brightness-override');
    }
    if (manualOverrides.focus) {
        html.classList.add('bio-adaptive-focus-mode');
    }
}

// Inject the generic CSS rules if they don't exist
function injectStyles() {
    if (document.getElementById('bio-adaptive-styles')) return;

    const style = document.createElement('style');
    style.id = 'bio-adaptive-styles';
    style.textContent = `
        /* Smooth transitions for adaptations */
        html {
            transition: filter 0.2s ease-in-out, font-size 0.2s ease-in-out !important;
        }

        /* Medium Font & Slight Dimming */
        html.bio-adaptive-medium-font {
            font-size: 105% !important;
            filter: brightness(0.9) sepia(0.1) !important;
        }

        /* Large Font Adaptation */
        html.bio-adaptive-large-font {
            font-size: 110% !important;
        }
        
        html.bio-adaptive-large-font p, 
        html.bio-adaptive-large-font article,
        html.bio-adaptive-large-font section,
        html.bio-adaptive-medium-font p {
            line-height: 1.7 !important;
            letter-spacing: 0.02em !important;
        }

        /* Focus Mode - HIGH FATIGUE */
        html.bio-adaptive-focus-mode {
            filter: brightness(0.8) sepia(0.2) contrast(0.95) !important;
        }

        html.bio-adaptive-focus-mode iframe,
        html.bio-adaptive-focus-mode aside,
        html.bio-adaptive-focus-mode .sidebar,
        html.bio-adaptive-focus-mode [class*="advert"],
        html.bio-adaptive-focus-mode [class*="banner"],
        html.bio-adaptive-focus-mode [class*="social"],
        html.bio-adaptive-focus-mode [id*="ad-"] {
            opacity: 0.2 !important;
            pointer-events: none !important;
            transition: opacity 0.2s ease-in-out !important;
        }

        /* Strict Focus Mode - CRITICAL FATIGUE */
        html.bio-adaptive-strict-focus {
            filter: brightness(0.7) sepia(0.3) contrast(0.95) !important;
        }

        html.bio-adaptive-strict-focus iframe,
        html.bio-adaptive-strict-focus aside,
        html.bio-adaptive-strict-focus .sidebar,
        html.bio-adaptive-strict-focus [class*="advert"],
        html.bio-adaptive-strict-focus [class*="banner"],
        html.bio-adaptive-strict-focus [class*="social"],
        html.bio-adaptive-strict-focus [id*="ad-"] {
            opacity: 0.05 !important;
            pointer-events: none !important;
            transition: opacity 0.2s ease-in-out !important;
        }

        /* Reduced Motion */
        html.bio-adaptive-reduced-motion *,
        html.bio-adaptive-reduced-motion *::before,
        html.bio-adaptive-reduced-motion *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
        }

        /* Manual Brightness Override */
        html.bio-adaptive-brightness-override {
            filter: brightness(0.7) !important;
        }
        
        /* Break Banner - Modern UI */
        #bio-adaptive-break-banner {
            position: fixed;
            top: 20px; 
            left: 50%;
            transform: translateX(-50%);
            width: auto;
            max-width: 400px;
            background: rgba(255, 59, 48, 0.9);
            color: #ffffff;
            text-align: center;
            padding: 16px 24px;
            border-radius: 12px;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            font-size: 16px;
            font-weight: 600;
            z-index: 2147483647; 
            box-shadow: 0 8px 32px rgba(255, 59, 48, 0.3);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.2);
            animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        @keyframes slideDown {
            from { top: -100px; opacity: 0; }
            to { top: 20px; opacity: 1; }
        }
    `;
    document.documentElement.appendChild(style);
}

function showBreakBanner() {
    if (document.getElementById('bio-adaptive-break-banner')) return;

    // Add banner
    breakBannerEl = document.createElement('div');
    breakBannerEl.id = 'bio-adaptive-break-banner';
    breakBannerEl.innerHTML = `⚠️ High Cognitive Fatigue Detected(${Date.now() % 1000} ms).Time for a short break to rest your eyes!`;
    document.body.appendChild(breakBannerEl);

    // Add screen tint
    const overlay = document.createElement('div');
    overlay.id = 'bio-adaptive-overlay';
    document.body.appendChild(overlay);
}

function removeBreakBanner() {
    const banner = document.getElementById('bio-adaptive-break-banner');
    if (banner) banner.remove();

    const overlay = document.getElementById('bio-adaptive-overlay');
    if (overlay) overlay.remove();
}

// --- PART 3: Behavioral Tracking (Privacy Mode) ---
let lastScrollTime = Date.now();
let lastTypeTime = Date.now();
let scrollCount = 0;
let keyCount = 0;
let behavioralTimer = null;

function startBehavioralTracking() {
    if (!isSystemActive) return;

    // Safety: ensure we don't attach multiple listeners
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('keydown', handleKeydown);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeydown, { passive: true });

    if (!behavioralTimer) {
        behavioralTimer = setInterval(analyzeBehavior, 3000); // Increased from 5s
    }
}

function stopBehavioralTracking() {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('keydown', handleKeydown);
    if (behavioralTimer) {
        clearInterval(behavioralTimer);
        behavioralTimer = null;
    }
}

function handleScroll() {
    lastScrollTime = Date.now();
    scrollCount++;
}

function handleKeydown() {
    lastTypeTime = Date.now();
    keyCount++;
}

function analyzeBehavior() {
    if (!isSystemActive) {
        stopBehavioralTracking();
        return;
    }

    chrome.storage.local.get(['privacyMode', 'fatigueScore'], (res) => {
        if (!res.privacyMode) {
            stopBehavioralTracking();
            return;
        }

        const now = Date.now();
        const timeSinceScroll = now - lastScrollTime;
        const timeSinceType = now - lastTypeTime;

        let score = res.fatigueScore || 0;

        // Stricter heuristic: if user is on the page but hasn't scrolled or typed in 30 seconds -> fatigue
        if (timeSinceScroll > 30000 && timeSinceType > 30000) {
            score = Math.min(100, score + 15); // Extreme increase for verification
        } else if (timeSinceScroll < 2000 || timeSinceType < 2000) {
            score = Math.max(0, score - 10);
        }

        chrome.runtime.sendMessage({
            type: 'UPDATE_FATIGUE_SCORE',
            score: score,
            behaviorData: {
                scrolls: scrollCount,
                keys: keyCount
            }
        });

        // Reset local counters after reporting
        scrollCount = 0;
        keyCount = 0;
    });
}

// User Override Detection: Detect Cmd/Ctrl + '+/-' or Wheel Zoom
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+' || e.key === '-' || e.key === '0') {
            chrome.runtime.sendMessage({ type: 'USER_OVERRIDE' });
        }
    }
});

window.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
        chrome.runtime.sendMessage({ type: 'USER_OVERRIDE' });
    }
}, { passive: true });

// Automatically inject styles on startup
injectStyles();
