chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'PLAY_BEEP') {
        playCriticalAlertBeep();
    }
});

function playCriticalAlertBeep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        for (let i = 0; i < 3; i++) {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'square';
            oscillator.frequency.value = 1000;

            const startTime = audioCtx.currentTime + (i * 0.4);
            const duration = 0.2;

            gainNode.gain.setValueAtTime(0.5, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        }
    } catch (e) {
        console.error("Audio playback inside offscreen document failed", e);
    }
}
