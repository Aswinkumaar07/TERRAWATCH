/**
 * Bio-Adaptive Cognitive Fatigue Detection System
 * Uses MediaPipe FaceMesh to calculate a fatigue score.
 */

// DOM Elements
const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('startBtn');
const cameraStatus = document.getElementById('cameraStatus');
const scanningOverlay = document.getElementById('scanningOverlay');
const themeToggleBtn = document.getElementById('themeToggleBtn');

// Theme Management
const savedTheme = localStorage.getItem('theme') || 'light';

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.setAttribute('data-theme', 'dark');
        // Moon icon for dark mode
        themeToggleBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.body.removeAttribute('data-theme');
        // Sun icon for light mode
        themeToggleBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    }
}

applyTheme(savedTheme);

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
});

// Metrics
const fatigueLabelEl = document.getElementById('fatigueLabel');
const fatigueMeterFill = document.getElementById('fatigueMeterFill');
const fatiguePercentageText = document.getElementById('fatiguePercentageText');

const blinkRateValueEl = document.getElementById('blinkRateValue');
const postureValueEl = document.getElementById('postureValue');
const typingSpeedValue = document.getElementById('typingSpeedValue');
const mouseActivityValue = document.getElementById('mouseActivityValue');
const focusValueEl = document.getElementById('focusValueEl');
const idleTimeValue = document.getElementById('idleTimeValue');

const breakWarningEl = document.getElementById('breakWarning');

const modeToggleBtn = document.getElementById('modeToggleBtn');

// Manual Toggles
const manualFontToggle = document.getElementById('manualFontToggle');
const manualBrightnessToggle = document.getElementById('manualBrightnessToggle');
const manualFocusToggle = document.getElementById('manualFocusToggle');
const voiceAssistantToggle = document.getElementById('voiceAssistantToggle');

// Alert Sound
const alertAudioContext = new (window.AudioContext || window.webkitAudioContext)();
let lastCriticalAlertTime = 0;

// Modal Elements
const extModal = document.getElementById('extModal');
const installExtBtn = document.getElementById('installExtBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

// Navigation Elements
const navDashboardBtn = document.getElementById('navDashboardBtn');
const navHistoryBtn = document.getElementById('navHistoryBtn');
const logoutBtn = document.getElementById('logoutBtn');
const viewDashboard = document.getElementById('viewDashboard');
const viewHistory = document.getElementById('viewHistory');

if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
}

navDashboardBtn.addEventListener('click', (e) => {
    e.preventDefault();
    navDashboardBtn.classList.add('active');
    navHistoryBtn.classList.remove('active');
    viewDashboard.style.display = 'grid';
    viewHistory.style.display = 'none';
});

navHistoryBtn.addEventListener('click', (e) => {
    e.preventDefault();
    navHistoryBtn.classList.add('active');
    navDashboardBtn.classList.remove('active');
    viewDashboard.style.display = 'none';
    viewHistory.style.display = 'block';
    renderHistoryCalendar();
    updatePeakAnalytics(); // Refresh Golden Hours
});

// Variables for logic
let isRunning = false;
let isPrivacyMode = false;
let lastVideoTime = -1;
let facemeshInstance = null;

let mediaStream = null;
let frameCounter = 0;
let lastAppliedState = null;
let tickerValue = 0;

// Dynamic Pomodoro Manager
class PomodoroManager {
    constructor() {
        this.workMinutes = 25;
        this.breakMinutes = 5;
        this.timeLeft = this.workMinutes * 60;
        this.timer = null;
        this.mode = 'work'; // 'work' or 'break'
        this.isRunning = false;
        
        this.pomoTimeText = document.getElementById('pomoTimeText');
        this.pomoRingFill = document.getElementById('pomoRingFill');
        this.pomoStatusText = document.getElementById('pomoStatusText');
        this.pomoAiSuggestion = document.getElementById('pomoAiSuggestion');
        this.pomoToggleBtn = document.getElementById('pomoToggleBtn');
        
        this.pomoToggleBtn.addEventListener('click', () => this.toggle());
        this.updateUI(); // Initial UI set
    }

    toggle() {
        if (this.isRunning) this.stop();
        else this.start();
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.pomoToggleBtn.innerText = "Pause Session";
        this.timer = setInterval(() => this.tick(), 1000);
    }

    stop() {
        this.isRunning = false;
        this.pomoToggleBtn.innerText = "Resume Session";
        clearInterval(this.timer);
    }

    reset() {
        this.stop();
        this.timeLeft = (this.mode === 'work' ? this.workMinutes : this.breakMinutes) * 60;
        this.updateUI();
    }

    tick() {
        if (this.timeLeft > 0) {
            this.timeLeft--;
            this.updateUI();
        } else {
            this.switchMode();
        }
    }

    switchMode() {
        this.stop();
        this.mode = this.mode === 'work' ? 'break' : 'work';
        this.timeLeft = (this.mode === 'work' ? this.workMinutes : this.breakMinutes) * 60;
        this.pomoStatusText.innerText = this.mode === 'work' ? "Deep Work Session" : "Recharge Break";
        this.updateUI();
        alertAudioContext.resume(); // Ensure audio context is active for possible alerts
        // Optional: play sound
    }

    updateUI() {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        this.pomoTimeText.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        const total = (this.mode === 'work' ? this.workMinutes : this.breakMinutes) * 60;
        const progress = (this.timeLeft / total) * 283;
        this.pomoRingFill.style.strokeDashoffset = progress;
        
        // Color transition
        if (this.mode === 'work') {
            this.pomoRingFill.style.stroke = "var(--primary-color)";
        } else {
            this.pomoRingFill.style.stroke = "var(--success-color)";
        }
    }

    adaptToFatigue(score) {
        if (!this.isRunning || this.mode !== 'work') return;

        if (score > 75) {
            this.pomoAiSuggestion.innerText = "CRITICAL: Brain needs immediate rest!";
            this.pomoAiSuggestion.style.color = "var(--danger-color)";
            // Auto-trigger break if critical
            if (this.timeLeft > 60) {
                this.timeLeft = 10; // Trigger break in 10s
                this.pomoStatusText.innerText = "Emergency Break Triggered";
            }
        } else if (score > 40) {
            this.pomoAiSuggestion.innerText = "AI suggesting: Shorten interval to 15m";
            this.pomoAiSuggestion.style.color = "var(--warning-color)";
            if (this.workMinutes > 15) this.workMinutes = 15;
        } else {
            this.pomoAiSuggestion.innerText = "AI suggesting: Optimal performance (25m)";
            this.pomoAiSuggestion.style.color = "var(--primary-color)";
            this.workMinutes = 25;
        }
    }

    switchMode() {
        this.stop();
        this.mode = this.mode === 'work' ? 'break' : 'work';
        this.timeLeft = (this.mode === 'work' ? this.workMinutes : this.breakMinutes) * 60;
        
        const statusText = this.mode === 'work' ? "Deep Work Session" : "Recharge Break";
        this.pomoStatusText.innerText = statusText;
        
        // AI Voice Buddy Intervention
        if (this.mode === 'break') {
            voiceBuddy.speak("Great job on your focus session. Time for a well-deserved recharge break.", true);
        } else {
            voiceBuddy.speak("Starting your focus session. Let's make it a productive one.", true);
        }

        this.updateUI();
        alertAudioContext.resume();
    }
}

// Eye Guardian Manager (20-20-20 Rule)
class EyeGuardian {
    constructor() {
        this.lastBlinkTime = Date.now();
        this.overlay = document.getElementById('eyeGuardianOverlay');
        this.staringThreshold = 20000; // 20 seconds without blink
        this.isCheckActive = false;
    }

    recordBlink() {
        this.lastBlinkTime = Date.now();
        if (this.overlay.classList.contains('active')) {
            this.overlay.classList.remove('active');
        }
    }

    check() {
        if (!isRunning) return;
        const now = Date.now();
        const timeSinceBlink = now - this.lastBlinkTime;

        if (timeSinceBlink > this.staringThreshold) {
            this.overlay.classList.add('active');
            voiceBuddy.speak("You've been staring at the screen for a while. Remember to blink and look away for a few seconds.");
        }
    }
}

const pomoManager = new PomodoroManager();
const eyeGuardian = new EyeGuardian();


// Quantum Spotlight Effect Logic
document.querySelectorAll('.card, header').forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

// Smooth Count-Up Animation (Optimized with Cancellation)
function animateValue(element, start, end, duration) {
    if (start === end) return;

    if (element.dataset.rafId) {
        cancelAnimationFrame(parseInt(element.dataset.rafId));
    }

    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.innerHTML = value + (element.dataset.suffix || "");
        if (progress < 1) {
            element.dataset.rafId = window.requestAnimationFrame(step);
        } else {
            delete element.dataset.rafId;
        }
    };
    element.dataset.rafId = window.requestAnimationFrame(step);
}

function triggerPulse(element) {
    if (!element) return;
    element.classList.add('pulse-glow');
    setTimeout(() => element.classList.remove('pulse-glow'), 600);
}

function updateBlinkRate(rate) {
    const prev = parseInt(blinkRateValueEl.innerText) || 0;
    animateValue(blinkRateValueEl, prev, rate, 500);
    triggerPulse(blinkRateValueEl.closest('.small-metric'));
}

function updateTypingSpeed(speed) {
    const prev = parseInt(typingSpeedValue.innerText) || 0;
    animateValue(typingSpeedValue, prev, Math.round(speed), 500);
    triggerPulse(typingSpeedValue.closest('.small-metric'));
}
let isProcessingFrame = false;

// Audio Context trick to prevent Chrome background throttling
let audioCtx = null;
let silenceNode = null;

function ensureTabActiveInBg() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        silenceNode = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0; // silent
        silenceNode.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        silenceNode.start();
    } catch (e) { console.error("Audio Context failed", e); }
}

function releaseTabFromBg() {
    if (silenceNode) {
        try {
            silenceNode.stop();
            silenceNode.disconnect();
        } catch (e) { }
        silenceNode = null;
    }
}

// Web Worker for raw background tick (bypasses Chrome 1000ms bg throttle)
const workerBlob = new Blob([`
    let intervalId = null;
    self.onmessage = function(e) {
        if (e.data === 'start') {
            intervalId = setInterval(() => self.postMessage('tick'), 100); // 10 FPS strictly
        } else if (e.data === 'stop') {
            clearInterval(intervalId);
        }
    };
`], { type: 'text/javascript' });
const tickerWorker = new Worker(URL.createObjectURL(workerBlob));

tickerWorker.onmessage = async () => {
    tickerValue++;
    if (isRunning && facemeshInstance && videoElement && videoElement.readyState >= 2 && !isProcessingFrame) {
        isProcessingFrame = true;
        try {
            await facemeshInstance.send({ image: videoElement });
        } catch (e) {
            // ignore dropped frames
        }
        isProcessingFrame = false;
    }
};

// Fatigue Metrics Tracking
let blinkCount = 0;
let lastBlinkTime = Date.now();
let eyeClosedFrames = 0;
let currentBlinkRate = 0; // Blinks per minute
let blinkTimestamps = [];

// Input / Behavioral Tracking
let keydownCount = 0;
let mouseMoveCount = 0;
let lastUserActivityTime = Date.now();

window.addEventListener('keydown', () => {
    keydownCount++;
    lastUserActivityTime = Date.now();
});

window.addEventListener('mousemove', () => {
    mouseMoveCount++;
    lastUserActivityTime = Date.now();
});

// Thresholds & Weights
const EYE_AR_THRESH = 0.20; // Eye aspect ratio threshold for blink
const MIN_EYE_CLOSED_FRAMES = 2;
const MOUTH_AR_THRESH = 0.45; // Mouth aspect ratio threshold for yawns
const MIN_YAWN_FRAMES = 10;
const SCORE_MAX = 100;

let yawnFrames = 0;
let recentYawns = 0;


// User Manual Toggles State
let manualOverrides = {
    fontSize: localStorage.getItem('settings_fontSize') === 'true',
    brightness: localStorage.getItem('settings_brightness') === 'true',
    focusMode: localStorage.getItem('settings_focusMode') === 'true'
};

// Sync UI checkboxes on load
manualFontToggle.checked = manualOverrides.fontSize;
manualBrightnessToggle.checked = manualOverrides.brightness;
manualFocusToggle.checked = manualOverrides.focusMode;

// Apply immediately on load
applyAccessibilityRules("apply-manual");

manualFontToggle.addEventListener('change', (e) => {
    manualOverrides.fontSize = e.target.checked;
    localStorage.setItem('settings_fontSize', e.target.checked);
    applyAccessibilityRules("apply-manual");
});
manualBrightnessToggle.addEventListener('change', (e) => {
    manualOverrides.brightness = e.target.checked;
    localStorage.setItem('settings_brightness', e.target.checked);
    applyAccessibilityRules("apply-manual");
});
manualFocusToggle.addEventListener('change', (e) => {
    manualOverrides.focusMode = e.target.checked;
    localStorage.setItem('settings_focusMode', e.target.checked);
    applyAccessibilityRules("apply-manual");
});

function setProgress(percent) {
    fatigueMeterFill.style.width = percent + '%';
    // Update fatigue percentage text using animateValue
    const previousScore = parseInt(fatiguePercentageText.innerText) || 0;
    animateValue(fatiguePercentageText, previousScore, Math.round(percent), 500);

    // Changing color based on 4-tier score
    if (percent <= 25) {
        fatigueMeterFill.style.backgroundColor = 'var(--success-color)';
    } else if (percent <= 50) {
        fatigueMeterFill.style.backgroundColor = 'var(--warning-color)';
    } else if (percent <= 75) {
        fatigueMeterFill.style.backgroundColor = 'orange';
    } else {
        fatigueMeterFill.style.backgroundColor = 'var(--danger-color)';
    }
}

// MediaPipe Setup
function initializeFaceMesh() {
    if (typeof window.FaceMesh === 'undefined') {
        console.error("Critical Error: window.FaceMesh is not defined despite script loading.");
        return;
    }
    facemeshInstance = new window.FaceMesh({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
    });

    facemeshInstance.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    facemeshInstance.onResults(onResults);
}

// Geometry helpers
function euclideanDistance(point1, point2) {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

function calculateEAR(eyeLandmarks, landmarks) {
    // MediaPipe face mesh landmarks indices for eye:
    // This is a simplified EAR calculation based on specific points
    // Left eye (using points 33, 160, 158, 133, 153, 144)
    // Right eye (using 362, 385, 387, 263, 373, 380)
    // To be precise, we use vertical and horizontal distances

    if (!landmarks || landmarks.length === 0) return 0;

    const pLeft = landmarks[eyeLandmarks[0]];
    const pRight = landmarks[eyeLandmarks[3]];
    const pTop1 = landmarks[eyeLandmarks[1]];
    const pTop2 = landmarks[eyeLandmarks[2]];
    const pBot1 = landmarks[eyeLandmarks[5]];
    const pBot2 = landmarks[eyeLandmarks[4]];

    const vert1 = euclideanDistance(pTop1, pBot1);
    const vert2 = euclideanDistance(pTop2, pBot2);
    const horiz = euclideanDistance(pLeft, pRight);

    return (vert1 + vert2) / (2.0 * horiz);
}

function calculateMAR(landmarks) {
    if (!landmarks || landmarks.length === 0) return 0;

    // Outer lip landmarks: corners 78 and 308
    // Top inner lip: 13, Bottom inner lip: 14
    // Top outer lip: 0, Bottom outer lip: 17

    const pLeft = landmarks[78];
    const pRight = landmarks[308];
    const pTopInner = landmarks[13];
    const pBotInner = landmarks[14];
    const pTopOuter = landmarks[0];
    const pBotOuter = landmarks[17];

    const vertInner = euclideanDistance(pTopInner, pBotInner);
    const vertOuter = euclideanDistance(pTopOuter, pBotOuter);
    const horiz = euclideanDistance(pLeft, pRight);

    // Using average of inner and outer vertical distance
    return ((vertInner + vertOuter) / 2.0) / horiz;
}

// Main logic implementation per frame
function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Translate and properly scale the canvas context horizontally to simulate a mirror
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);

    // Draw raw video frame on canvas (now mirrored)
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // Restore context immediately after drawing the image so any overlays (if added later) aren't flipped
    canvasCtx.restore();
    canvasCtx.save(); // Save again for potential future operations in this block

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Analyze Facial Metrics for Fatigue
        analyzeFatigue(landmarks);
    } else {
        // Face lost - throttling text update
        if (frameCounter % 10 === 0) {
            postureValueEl.innerText = "No Face Detected";
            focusValueEl.innerText = "Low";
        }
    }

    frameCounter++;
    canvasCtx.restore();
}

const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];

function analyzeFatigue(landmarks) {
    // 1. Calculate Eye Aspect Ratio (EAR) for blinks
    const leftEAR = calculateEAR(LEFT_EYE_INDICES, landmarks);
    const rightEAR = calculateEAR(RIGHT_EYE_INDICES, landmarks);
    const avgEAR = (leftEAR + rightEAR) / 2.0;

    if (avgEAR < EYE_AR_THRESH) {
        eyeClosedFrames++;
    } else {
        if (eyeClosedFrames >= MIN_EYE_CLOSED_FRAMES) {
            // Document a blink
            recordBlink();
            eyeGuardian.recordBlink(); // Track for Eye Guardian
        }
        eyeClosedFrames = 0;
    }

    // 2. Head Posture Estimation (Simplified using nose relative to ears)
    const nose = landmarks[1];
    const leftEar = landmarks[234];
    const rightEar = landmarks[454];

    let posture = "Upright";
    let headTiltFactor = 0; // 0-100 impact on fatigue

    if (nose.y > leftEar.y + 0.05 && nose.y > rightEar.y + 0.05) {
        posture = "Tilted Down / Nodding";
        headTiltFactor = 40;
    } else if (nose.x < leftEar.x - 0.2 || nose.x > rightEar.x + 0.2) {
        posture = "Looking Away";
        headTiltFactor = 30;
    }

    if (frameCounter % 10 === 0) {
        postureValueEl.innerText = posture;
    }

    // 3. Yawn Detection (Mouth Aspect Ratio)
    const mar = calculateMAR(landmarks);
    let yawnFactor = 0;

    if (mar > MOUTH_AR_THRESH) {
        yawnFrames++;
        if (yawnFrames >= MIN_YAWN_FRAMES) {
            yawnFactor = 35; // Yawns are a massive indicator of fatigue
            postureValueEl.innerText = "Yawning! (" + posture + ")";
            postureValueEl.style.color = "var(--danger-color)";
        }
    } else {
        if (yawnFrames >= MIN_YAWN_FRAMES) {
            recentYawns++;
            // clear yawning status color
            postureValueEl.style.color = "var(--text-primary)";
        }
        yawnFrames = 0;
    }

    // Add historical yawn penalty to current frame factor if recent yawns exist
    // Each recent yawn adds a persistent +15 to the score, fading out over time (handled by the timer)
    let historicalYawnFactor = Math.min(recentYawns * 15, 45);

    // 4. Compute Final Fatigue Score
    computeFatigueScore(headTiltFactor, yawnFactor + historicalYawnFactor);
}

function recordBlink() {
    const now = Date.now();
    blinkTimestamps.push(now);

    // Only keeping blinks from the last 60 seconds
    blinkTimestamps = blinkTimestamps.filter(t => now - t < 60000);
    currentBlinkRate = blinkTimestamps.length;

    blinkRateValueEl.innerText = `${currentBlinkRate} / min`;
}

// Timer to clean up blinks array if user stops blinking
setInterval(() => {
    if (!isRunning) return;
    const now = Date.now();
    blinkTimestamps = blinkTimestamps.filter(t => now - t < 60000);
    currentBlinkRate = blinkTimestamps.length;
    blinkRateValueEl.innerText = `${currentBlinkRate} / min`;

    // Slowly decay recent yawns over time
    if (recentYawns > 0) {
        recentYawns--;
    }

    // Evaluate Input Activity (Keyboard/Mouse) every 10 seconds
    const idleSeconds = Math.floor((now - lastUserActivityTime) / 1000);

    // Typing Speed (keys per minute estimation)
    let typingSpeedEstimate = keydownCount * 6;
    if (typingSpeedEstimate === 0) {
        typingSpeedValue.innerText = "No Activity";
    } else if (typingSpeedEstimate < 30) {
        typingSpeedValue.innerText = "Slow (" + typingSpeedEstimate + " cpm)";
    } else {
        typingSpeedValue.innerText = "Active (" + typingSpeedEstimate + " cpm)";
    }

    // Mouse Activity
    if (mouseMoveCount === 0) {
        mouseActivityValue.innerText = "Idle";
    } else if (mouseMoveCount < 10) {
        mouseActivityValue.innerText = "Low";
    } else {
        mouseActivityValue.innerText = "Active";
    }

    // Update Idle Time Display
    if (idleSeconds > 60) {
        idleTimeValue.innerText = Math.floor(idleSeconds / 60) + " min idle";
        idleTimeValue.style.color = "var(--warning-color)";
    } else if (idleSeconds > 10) {
        idleTimeValue.innerText = idleSeconds + "s idle";
        idleTimeValue.style.color = "var(--text-secondary)";
    } else {
        idleTimeValue.innerText = "Active";
        idleTimeValue.style.color = "var(--success-color)";
    }

    // Reset counters for next 10-second window
    keydownCount = 0;
    mouseMoveCount = 0;

    // --- Analytics Recording (Every 60s) ---
    // We use the 10s tick, trigger every 6th tick.
    if (!window.minuteTick) window.minuteTick = 0;
    window.minuteTick++;
    if (window.minuteTick >= 6) {
        window.minuteTick = 0;
        recordMinuteData();
    }

    // Eye Guardian Periodic Check
    eyeGuardian.check();

}, 10000); // Check every 10 seconds

let lastBroadcastTime = 0;

function computeFatigueScore(headTiltFactor, totalYawnFactor) {
    let score = 0;

    // Factor 1: Blink Rate
    // Normal resting blink rate is ~15-20 blinks/min. High blink rate indicates sleepiness.
    let blinkFactor = 0;
    if (currentBlinkRate < 5) blinkFactor = 0; // Just started or staring
    else if (currentBlinkRate > 15) blinkFactor = Math.min((currentBlinkRate - 15) * 3, 40); // Increased sensitivity
    else if (currentBlinkRate < 10) blinkFactor = 10;

    // Factor 2: Eye closure duration
    // If eyes are closed for longer than normal blink (>5 frames)
    let closureFactor = 0;
    if (eyeClosedFrames > 10) { // Lowered from 15 for faster detection
        closureFactor = 60; // Micro-sleep
    } else if (eyeClosedFrames > 4) { // Lowered from 5
        closureFactor = 25; // Heavy blinks
    }

    score = Math.min(SCORE_MAX, blinkFactor + closureFactor + headTiltFactor + totalYawnFactor);

    // Smoothing the score display - 80/20 ratio for faster reaction
    const currentScoreText = fatiguePercentageText.innerText.replace('%', '');
    const currentDisplayed = parseInt(currentScoreText) || 0;
    const smoothedScore = Math.floor(currentDisplayed * 0.8 + score * 0.2);

    updateDashboardUI(smoothedScore);
    pomoManager.adaptToFatigue(smoothedScore); // AI Adaptive Pomodoro

    // Broadcast state to Chrome Extension via postMessage periodically
    const now = Date.now();
    if (now - lastBroadcastTime > 1000) { // Send every 1 second
        broadcastStateToExtension(smoothedScore);
        lastBroadcastTime = now;
    }
}

function updateDashboardUI(score) {
    if (score === null || score === undefined || isNaN(score)) return;
    const numericScore = Number(score);
    setProgress(numericScore);

    // Determine focus - Throttled text updates
    if (frameCounter % 10 === 0) {
        if (score <= 25) {
            fatigueLabelEl.innerText = "LOW FATIGUE (Normal)";
            fatigueLabelEl.style.color = "var(--success-color)";
            focusValueEl.innerText = "High";
            applyAccessibilityRules("mode-normal");
        } else if (score <= 50) {
            fatigueLabelEl.innerText = "MEDIUM FATIGUE (Mild)";
            fatigueLabelEl.style.color = "var(--warning-color)";
            focusValueEl.innerText = "Medium";
            applyAccessibilityRules("mode-medium");
        } else if (score <= 75) {
            fatigueLabelEl.innerText = "HIGH FATIGUE (Distracted)";
            fatigueLabelEl.style.color = "orange";
            focusValueEl.innerText = "Low";
            applyAccessibilityRules("mode-high");
        } else {
            fatigueLabelEl.innerText = "CRITICAL FATIGUE (Exhausted)";
            fatigueLabelEl.style.color = "var(--danger-color)";
            focusValueEl.innerText = "None";
            applyAccessibilityRules("mode-critical");
        }
    } else {
        // Still need to update rules logic even if labels aren't updated?
        // No, rules check smoothed score every frame, but we guard it in applyAccessibilityRules.
        // Let's call it every frame, the guard will handle performance.
        if (score <= 25) applyAccessibilityRules("mode-normal");
        else if (score <= 50) applyAccessibilityRules("mode-medium");
        else if (score <= 75) applyAccessibilityRules("mode-high");
        else applyAccessibilityRules("mode-critical");
    }

    // Critical Break Warning local UI display (controlled at 70 for local display, 70-for-20s by extension)
    if (score > 70) {
        if (!breakWarningEl.innerHTML.includes('logo-img')) {
            breakWarningEl.innerHTML = `
                <div class="alert-header">
                    <img src="logo.png" alt="BioAdaptive Logo" class="logo-img alert-logo">
                    <h3>Critical Fatigue Detected</h3>
                </div>
                <p>Your cognitive focus is dropping significantly. Please take a short break to recharge.</p>
                <button class="primary-btn" onclick="this.parentElement.style.display='none'">Acknowledge</button>
            `;
        }
        breakWarningEl.style.display = "block";
        voiceBuddy.speak("Your fatigue level is high. I recommend taking a quick break to stay productive.");
    } else {
        breakWarningEl.style.display = "none";
    }
}

// Apply accessibility to THIS web app panel (Optimized with State Guard)
function applyAccessibilityRules(mode) {
    if (lastAppliedState === mode) return;
    lastAppliedState = mode;

    document.body.className = ''; // remove existing
    if (mode === 'mode-medium') document.body.classList.add('mode-medium-font');
    if (mode === 'mode-high') document.body.classList.add('mode-large-font', 'mode-focus-mode');
    if (mode === 'mode-critical') document.body.classList.add('mode-large-font', 'mode-strict-focus');
}

// Manual Override Toggles
if (manualFontToggle) {
    manualFontToggle.addEventListener('change', (e) => {
        window.postMessage({ type: 'BIO_ADAPTIVE_MANUAL_TOGGLE', overrideType: 'font', value: e.target.checked }, '*');
    });
}
if (manualBrightnessToggle) {
    manualBrightnessToggle.addEventListener('change', (e) => {
        window.postMessage({ type: 'BIO_ADAPTIVE_MANUAL_TOGGLE', overrideType: 'brightness', value: e.target.checked }, '*');
    });
}
if (manualFocusToggle) {
    manualFocusToggle.addEventListener('change', (e) => {
        window.postMessage({ type: 'BIO_ADAPTIVE_MANUAL_TOGGLE', overrideType: 'focus', value: e.target.checked }, '*');
    });
}


// Broadcast to local content script
function broadcastStateToExtension(score) {
    window.postMessage({
        type: 'BIO_ADAPTIVE_STATE',
        fatigueScore: score,
        timestamp: Date.now()
    }, '*');
}

// Main Start/Stop Button Logic (Primary Action)
if (startBtn) {
    startBtn.addEventListener('click', () => {
        if (!isRunning) {
            // Always start camera mode when clicking "Enable Camera & Start"
            isPrivacyMode = false;
            startCamera();
        } else {
            stopSystem();
        }
    });
}

// Mode Button Toggle (Secondary Action)
if (modeToggleBtn) {
    modeToggleBtn.addEventListener('click', () => {
        if (!isRunning) {
            // Start in Behavior Mode
            isPrivacyMode = true;
            startBehaviorMode();
        } else {
            // Switch current mode
            isPrivacyMode = !isPrivacyMode;

            // Broadcast to extension
            window.postMessage({
                type: 'BIO_ADAPTIVE_PRIVACY_TOGGLE',
                privacyMode: isPrivacyMode
            }, '*');

            if (isPrivacyMode) {
                // Transitioning to Behavior (Stop camera if it was on)
                if (mediaStream) {
                    mediaStream.getTracks().forEach(track => track.stop());
                    videoElement.srcObject = null;
                    mediaStream = null;
                }
                if (facemeshInstance) {
                    facemeshInstance.close();
                    facemeshInstance = null;
                }
                cameraStatus.querySelector('.status-text').innerText = "Behavioral Mode Active";
            } else {
                // Transitioning to Vision (Start camera)
                startCamera();
            }
            updatePrivacyUI(isPrivacyMode);
        }
    });
}

async function startCamera() {
    if (mediaStream) return; // Camera already active

    startBtn.innerText = "Initializing...";
    startBtn.disabled = true;
    scanningOverlay.style.display = 'flex';
    scanningOverlay.innerHTML = "<p>Loading AI Models...</p>";

    try {
        if (!facemeshInstance) {
            initializeFaceMesh();
        }

        ensureTabActiveInBg();

        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        videoElement.srcObject = mediaStream;

        await new Promise((resolve) => {
            videoElement.onloadedmetadata = () => {
                videoElement.play();
                resolve();
            };
        });

        isRunning = true;
        isPrivacyMode = false;
        tickerWorker.postMessage('start');

        // Notify background that system is active
        window.postMessage({ type: 'BIO_ADAPTIVE_START_SYSTEM' }, '*');

        cameraStatus.classList.add('active');
        cameraStatus.querySelector('.status-text').innerText = "Camera Active & Processing";
        scanningOverlay.style.display = 'none';

        updatePrivacyUI(false);
    } catch (error) {
        console.error("Error starting camera or AI:", error);
        scanningOverlay.innerHTML = `<p style="color:#ff3b30">Error accessing camera.<br>Please ensure permissions are granted and no other app is using it.</p>`;
        stopSystem(true); // Keep the error message
    }
}

function startBehaviorMode() {
    isRunning = true;
    isPrivacyMode = true;

    ensureTabActiveInBg();
    tickerWorker.postMessage('start');

    // Notify background that system is active
    window.postMessage({ type: 'BIO_ADAPTIVE_START_SYSTEM' }, '*');

    cameraStatus.classList.add('active');
    cameraStatus.querySelector('.status-text').innerText = "Behavioral Mode Active";
    scanningOverlay.style.display = 'none';

    updatePrivacyUI(true);

    // Broadcast state to extension
    window.postMessage({
        type: 'BIO_ADAPTIVE_PRIVACY_TOGGLE',
        privacyMode: true
    }, '*');
}

function stopSystem(keepError = false) {
    isRunning = false;

    // Notify background that system is stopped
    window.postMessage({ type: 'BIO_ADAPTIVE_STOP_SYSTEM' }, '*');

    tickerWorker.postMessage('stop');
    releaseTabFromBg();

    if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => { });
    }

    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
        mediaStream = null;
        isProcessingFrame = false;
    }

    if (facemeshInstance) {
        try { facemeshInstance.close(); } catch (e) { }
        facemeshInstance = null;
    }

    cameraStatus.classList.remove('active');
    cameraStatus.querySelector('.status-text').innerText = "Camera Inactive";

    if (!keepError) {
        scanningOverlay.style.display = 'flex';
        scanningOverlay.innerHTML = "<p>System Stopped</p>";
    }

    // Reset metrics UI
    if (document.getElementById('fatigueValue')) document.getElementById('fatigueValue').innerText = '0';
    setProgress(0);

    blinkRateValueEl.innerText = "0 bpm";
    postureValueEl.innerText = "Upright";
    focusValueEl.innerText = "High";
    typingSpeedValue.innerText = "0 wpm";
    mouseActivityValue.innerText = "Steady";
    idleTimeValue.innerText = "0m";

    currentBlinkRate = 0;
    blinkTimestamps = [];
    yawnFrames = 0;
    recentYawns = 0;

    updatePrivacyUI(isPrivacyMode);
}

function updatePrivacyUI(isPrivacy) {
    isPrivacyMode = isPrivacy;

    if (!isRunning) {
        // System is STOPPED: Show dual-start options
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerText = "Enable Camera & Start";
            startBtn.classList.remove('danger-btn');
            startBtn.classList.add('primary-btn');
            startBtn.style.backgroundColor = '';
        }
        if (modeToggleBtn) {
            modeToggleBtn.innerText = "Enable Behavior Mode & Start";
        }
    } else {
        // System is RUNNING
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerText = "Stop System";
            startBtn.classList.add('danger-btn');
            startBtn.classList.remove('primary-btn');
            startBtn.style.backgroundColor = 'var(--danger-color)';
        }

        if (modeToggleBtn) {
            modeToggleBtn.innerText = isPrivacy ? "Switch to Vision Mode (Camera)" : "Switch to Behavior Mode";
        }
    }
}

let isPrivacyModeStartedBySync = false;

// Listening for messages from Extension (Relayed through content.js)
window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;

    // Reliability Ack
    if (event.data.type === 'BIO_ADAPTIVE_ACK') {
        const syncStatusEl = document.getElementById('syncStatus');
        if (syncStatusEl) {
            syncStatusEl.innerText = "Active";
            syncStatusEl.className = "badge bg-active";
        }
    }

    // Sync metrics from behavior mode
    if (event.data.type === 'BIO_ADAPTIVE_BEHAVIOR_REPORT' && isRunning) {
        const data = event.data.behaviorData;

        // Update Blink Rate
        updateBlinkRate(Math.round(data.blinkRate));

        // Update Posture
        postureValueEl.innerText = data.isUpright ? "Upright" : "Leaning";
        if (!data.isUpright) triggerPulse(postureValueEl.closest('.small-metric'));

        // Update Typing Speed (cumulative simple mapping)
        keydownCount += data.keys;
        updateTypingSpeed(keydownCount * 6);

        // Update Mouse/Scroll activity
        mouseMoveCount += data.scrolls;
        mouseActivityValue.innerText = mouseMoveCount > 50 ? "Active" : "Steady";
        if (data.scrolls > 0) triggerPulse(mouseActivityValue.closest('.small-metric'));

        // Update Idle time
        idleTimeValue.innerText = Math.floor(data.idleTime / 60) + "m";
        if (data.idleTime === 0 && tickerValue % 10 === 0) triggerPulse(idleTimeValue.closest('.small-metric'));

        lastUserActivityTime = Date.now();
    }

    // Sync fatigue score if coming from behavior mode analysis in background
    if (event.data.type === 'BIO_ADAPTIVE_STATE_UPDATE' && isRunning) {
        const score = event.data.fatigueScore;
        updateDashboardUI(score);
        setProgress(score); // Ensure setProgress is used for fatigue
    }

    // Sync Privacy Mode from External (Extension Popup or Initialization)
    if (event.data.type === 'BIO_ADAPTIVE_PRIVACY_SYNC') {
        const isPrivacy = !!event.data.privacyMode;

        // If we haven't initialized systemActive yet, this might be the first sync
        // If we haven't initialized systemActive yet, we sync the UI state
        // but we do NOT auto-start the system logic.
        if (event.data.systemActive !== undefined) {
            if (!event.data.systemActive) {
                // Force stop UI if not running
                tickerWorker.postMessage('stop');
                cameraStatus.classList.remove('active');
                cameraStatus.querySelector('.status-text').innerText = "Camera Inactive";
                scanningOverlay.style.display = 'flex';
                scanningOverlay.innerHTML = "<p>System Stopped</p>";
                setProgress(0);
            }
        }

        isPrivacyModeStartedBySync = true;
        updatePrivacyUI(isPrivacy);
        isPrivacyModeStartedBySync = false;
    }

    // New: Handle START/STOP globally from another tab if needed
    if (event.data.type === 'SYSTEM_STATE_CHANGED') {
        isRunning = event.data.systemActive;
        if (!isRunning) {
            // Clean up if stopped from elsewhere
            tickerWorker.postMessage('stop');
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                videoElement.srcObject = null;
                mediaStream = null;
            }
            cameraStatus.classList.remove('active');
            cameraStatus.querySelector('.status-text').innerText = "Camera Inactive";
            scanningOverlay.style.display = 'flex';
            scanningOverlay.innerHTML = "<p>System Stopped</p>";
            setProgress(0);
        }
        updatePrivacyUI(isPrivacyMode);
    }

    if (event.data.type === 'BIO_ADAPTIVE_MANUAL_SYNC') {
        const overrides = event.data.manualOverrides;
        if (manualFontToggle) manualFontToggle.checked = !!overrides.font;
        if (manualBrightnessToggle) manualBrightnessToggle.checked = !!overrides.brightness;
        if (manualFocusToggle) manualFocusToggle.checked = !!overrides.focus;
    }
});

// Modal Actions
installExtBtn.addEventListener('click', (e) => {
    e.preventDefault();
    extModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
    extModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === extModal) {
        extModal.style.display = 'none';
    }
});

// ==========================================
// HISTORY & ANALYTICS LOGIC (Phase 3)
// ==========================================

function getTodayKey() {
    const today = new Date();
    return `bio_adaptive_${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
}

function recordMinuteData() {
    if (!isRunning) return;

    // Get current smoothed score from UI text directly since the raw score isn't global
    const currentScore = parseInt(fatiguePercentageText.innerText) || 0;
    const idleSeconds = Math.floor((Date.now() - lastUserActivityTime) / 1000);
    const typingEst = keydownCount * 6; // Grabbed from the 10s window approx

    const nowTimeString = `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;
    const dataPoint = {
        timestamp: nowTimeString,
        score: currentScore,
        blinkRate: currentBlinkRate,
        typingSpeed: typingEst,
        wasIdle: idleSeconds > 60
    };

    const key = getTodayKey();
    let dailyData = JSON.parse(localStorage.getItem(key)) || [];
    dailyData.push(dataPoint);
    localStorage.setItem(key, JSON.stringify(dailyData));
}

let currentCalendarDate = new Date();
let dailyFatigueChart = null;

function renderDailyChart(storedData) {
    if (!storedData || storedData.length === 0) return;

    const scrollWrapper = document.getElementById('chartScrollWrapper');
    const chartContainer = document.getElementById('chartContainer');

    // Reset container to 100% width so it doesn't scroll anymore
    if (dailyFatigueChart) {
        dailyFatigueChart.destroy();
    }
    chartContainer.innerHTML = '<canvas id="dailyChart"></canvas>';
    chartContainer.style.width = '100%';
    scrollWrapper.style.overflowX = 'hidden';

    // Group the data into 24 hourly buckets
    const hourlyData = new Array(24).fill(null);
    const hourlyCounts = new Array(24).fill(0);

    storedData.forEach(d => {
        // Only process data points with authentic timestamps
        if (d.timestamp && d.timestamp.includes(':')) {
            const hour = parseInt(d.timestamp.split(':')[0]);
            if (hourlyData[hour] === null) hourlyData[hour] = 0;
            hourlyData[hour] += d.score;
            hourlyCounts[hour]++;
        }
    });

    const labels = [];
    const scores = [];

    for (let h = 0; h < 24; h++) {
        labels.push(`${h.toString().padStart(2, '0')}:00`);
        if (hourlyCounts[h] > 0) {
            scores.push(Math.round(hourlyData[h] / hourlyCounts[h]));
        } else {
            scores.push(null); // No data for this hour
        }
    }

    const ctx = document.getElementById('dailyChart').getContext('2d');

    const style = getComputedStyle(document.body);
    const primaryStr = style.getPropertyValue('--primary-color').trim() || '#3b82f6';
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#F9FAFB' : '#1d1d1f';
    const gridColor = isDark ? '#374151' : '#d2d2d7';

    dailyFatigueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Avg Hourly Fatigue',
                data: scores,
                borderColor: primaryStr,
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 102, 204, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                spanGaps: false, // accurately show a broken graph if the user turns off the camera
                pointRadius: 3,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textColor, maxTicksLimit: 12 }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `Fatigue: ${context.parsed.y}%`
                    }
                }
            }
        }
    });
}

function renderHistoryCalendar(date = currentCalendarDate) {
    const calendarDays = document.getElementById('calendarDays');
    const monthSelect = document.getElementById('calendarMonthSelect');
    const yearSelect = document.getElementById('calendarYearSelect');
    calendarDays.innerHTML = '';

    const year = date.getFullYear();
    const month = date.getMonth();

    // Populate Year Dropdown if empty
    if (yearSelect.options.length === 0) {
        const currentY = new Date().getFullYear();
        for (let y = currentY - 2; y <= currentY + 2; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.innerText = y;
            yearSelect.appendChild(opt);
        }
    }

    // Set Header Dropdowns
    monthSelect.value = month;
    yearSelect.value = year;

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Pad empty days at start of month
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDiv);
    }

    const today = new Date();

    // Render the days
    for (let day = 1; day <= daysInMonth; day++) {
        const checkDate = new Date(year, month, day);
        const dateKey = `bio_adaptive_${checkDate.getFullYear()}-${(checkDate.getMonth() + 1).toString().padStart(2, '0')}-${checkDate.getDate().toString().padStart(2, '0')}`;
        const storedData = JSON.parse(localStorage.getItem(dateKey));

        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';

        let avgScore = 0;
        let avgBlink = 0;
        let avgTyping = 0;
        let totalIdleMins = 0;

        // Is Future Day?
        if (checkDate > today) {
            dayDiv.classList.add('future');
            dayDiv.innerHTML = `<span class="day-num">${day}</span>`;
            dayDiv.style.cursor = 'default';
        }
        else if (storedData && storedData.length > 0) {
            avgScore = Math.round(storedData.reduce((sum, d) => sum + d.score, 0) / storedData.length);
            avgBlink = Math.round(storedData.reduce((sum, d) => sum + d.blinkRate, 0) / storedData.length);
            avgTyping = Math.round(storedData.reduce((sum, d) => sum + d.typingSpeed, 0) / storedData.length);
            totalIdleMins = storedData.filter(d => d.wasIdle).length;

            if (avgScore <= 25) dayDiv.classList.add('status-low');
            else if (avgScore <= 50) dayDiv.classList.add('status-medium');
            else if (avgScore <= 75) dayDiv.classList.add('status-high');
            else dayDiv.classList.add('status-critical');

            dayDiv.title = `Average Score: ${avgScore}`;
            dayDiv.innerHTML = `
                <span class="day-num">${day}</span>
                <span class="day-score">${avgScore}</span>
            `;

            // Interaction
            dayDiv.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                dayDiv.classList.add('selected');
                document.getElementById('detailDateHeading').innerText = checkDate.toDateString();
                document.getElementById('dailyDetailCard').style.display = 'block';
                document.getElementById('detailScore').innerText = avgScore;
                document.getElementById('detailBlink').innerText = avgBlink + ' / min';
                document.getElementById('detailTyping').innerText = avgTyping + ' cpm';
                document.getElementById('detailIdle').innerText = totalIdleMins + ' min';

                // Show chart
                document.getElementById('dailyChart').style.display = 'block';
                renderDailyChart(storedData);
            });
        }
        else {
            // Past day, no data
            dayDiv.classList.add('past-empty');
            dayDiv.title = "No data recorded";
            dayDiv.innerHTML = `<span class="day-num">${day}</span>`;

            dayDiv.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                dayDiv.classList.add('selected');
                document.getElementById('detailDateHeading').innerText = checkDate.toDateString();
                document.getElementById('dailyDetailCard').style.display = 'block';
                document.getElementById('detailScore').innerText = "No Data";
                document.getElementById('detailBlink').innerText = "--";
                document.getElementById('detailTyping').innerText = "--";
                document.getElementById('detailIdle').innerText = "--";

                // Hide chart
                document.getElementById('dailyChart').style.display = 'none';
            });
        }

        calendarDays.appendChild(dayDiv);
    }
}

// Pagination Listeners
document.getElementById('prevMonthBtn').addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderHistoryCalendar(currentCalendarDate);
});

document.getElementById('nextMonthBtn').addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderHistoryCalendar(currentCalendarDate);
});

document.getElementById('calendarMonthSelect').addEventListener('change', (e) => {
    currentCalendarDate.setMonth(parseInt(e.target.value));
    renderHistoryCalendar(currentCalendarDate);
});

document.getElementById('calendarYearSelect').addEventListener('change', (e) => {
    currentCalendarDate.setFullYear(parseInt(e.target.value));
    renderHistoryCalendar(currentCalendarDate);
});

// CSV Export Logic
document.getElementById('exportCsvBtn').addEventListener('click', () => {
    let csvContent = "data:text/csv;charset=utf-8,Date,Avg Score,Avg Blink Rate,Avg Typing Speed (CPM),Total Idle Minutes\n";

    // Sort keys by date
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('bio_adaptive_')) {
            keys.push(key);
        }
    }
    keys.sort();

    keys.forEach(key => {
        const dateStr = key.replace('bio_adaptive_', '');
        const data = JSON.parse(localStorage.getItem(key));
        if (data && data.length > 0) {
            const avgScore = Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length);
            const avgBlink = Math.round(data.reduce((sum, d) => sum + d.blinkRate, 0) / data.length);
            const avgTyping = Math.round(data.reduce((sum, d) => sum + d.typingSpeed, 0) / data.length);
            const totalIdleMins = data.filter(d => d.wasIdle).length;
            csvContent += `${dateStr},${avgScore},${avgBlink},${avgTyping},${totalIdleMins}\n`;
        }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Cognitive_Fatigue_Data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// --- AI Voice Assistant & Peak Analytics ---

class VoiceAssistant {
    constructor() {
        this.synth = window.speechSynthesis;
        this.lastSpeakTime = 0;
        this.cooldown = 120000; // 2 minutes cooldown for general tips
        this.isEnabled = localStorage.getItem('settings_voiceBuddy') !== 'false';
    }

    speak(text, priority = false) {
        if (!this.isEnabled || !this.synth) return;
        
        const now = Date.now();
        if (!priority && (now - this.lastSpeakTime < this.cooldown)) return;

        // Cancel existing speech if priority
        if (priority) this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        this.synth.speak(utterance);
        this.lastSpeakTime = now;
    }

    setEnable(val) {
        this.isEnabled = val;
        localStorage.setItem('settings_voiceBuddy', val);
        if (!val) this.synth.cancel();
    }
}

const voiceBuddy = new VoiceAssistant();
if (voiceAssistantToggle) {
    voiceAssistantToggle.checked = voiceBuddy.isEnabled;
    voiceAssistantToggle.addEventListener('change', (e) => {
        voiceBuddy.setEnable(e.target.checked);
    });
}

function updatePeakAnalytics() {
    const hourlyFocus = Array(24).fill(0).map(() => ({ total: 0, count: 0 }));
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('bio_adaptive_')) {
            const data = JSON.parse(localStorage.getItem(key));
            if (data) {
                data.forEach(entry => {
                    // entry.timestamp is "HH:MM"
                    if (entry.timestamp && entry.timestamp.includes(':')) {
                        const hour = parseInt(entry.timestamp.split(':')[0]);
                        const focusScore = 100 - entry.score; // Invert fatigue
                        hourlyFocus[hour].total += focusScore;
                        hourlyFocus[hour].count++;
                    }
                });
            }
        }
    }

    const grid = document.getElementById('peakHoursGrid');
    const insightText = document.getElementById('aiInsightMessage');
    if (!grid) return;

    grid.innerHTML = '';
    let maxFocus = 0;
    let peakHour = -1;

    const hourAverages = hourlyFocus.map((h, i) => {
        const avg = h.count > 0 ? (h.total / h.count) : 0;
        if (avg > maxFocus) {
            maxFocus = avg;
            peakHour = i;
        }
        return avg;
    });

    hourAverages.forEach((avg, hour) => {
        const bar = document.createElement('div');
        bar.className = 'bar-item';
        if (hour === peakHour && avg > 20) bar.classList.add('peak');
        
        const heightPercent = maxFocus > 0 ? (avg / maxFocus) * 100 : 0;
        bar.style.height = `${Math.max(4, heightPercent)}%`;
        
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        bar.setAttribute('data-label', `${displayHour} ${ampm}: ${Math.round(avg)}% Focus`);
        
        grid.appendChild(bar);
    });

    if (peakHour !== -1 && maxFocus > 20) {
        const ampm = peakHour >= 12 ? 'PM' : 'AM';
        const displayHour = peakHour % 12 || 12;
        insightText.innerText = `Your "Golden Hour" is ${displayHour} ${ampm}. You're at your peak focus then—perfect for complex tasks!`;
    } else {
        insightText.innerText = "Keep using BioAdaptive to discover your cognitive Golden Hours! Use the dashboard throughout the day to build your profile.";
    }
}

// Initial update for analytics
updatePeakAnalytics();
