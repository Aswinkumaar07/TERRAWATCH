document.addEventListener('DOMContentLoaded', () => {
    const scoreValue = document.getElementById('scoreValue');
    const scoreCircle = document.getElementById('scoreCircle');
    const focusStatus = document.getElementById('focusStatus');
    const privacyToggle = document.getElementById('privacyToggle');
    const alterationsList = document.getElementById('alterationsList');
    const openAppBtn = document.getElementById('openAppBtn');

    // Load initial state
    chrome.storage.local.get(['fatigueScore', 'privacyMode', 'activeState', 'systemActive'], (res) => {
        updateUI(res.fatigueScore || 0, res.activeState || 'LOW_FATIGUE', res.privacyMode || false, res.systemActive || false);
        privacyToggle.checked = res.privacyMode || false;
    });

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes) => {
        chrome.storage.local.get(['fatigueScore', 'privacyMode', 'activeState', 'systemActive'], (res) => {
            updateUI(res.fatigueScore || 0, res.activeState || 'LOW_FATIGUE', res.privacyMode || false, res.systemActive || false);
            if (changes.privacyMode) {
                privacyToggle.checked = changes.privacyMode.newValue;
            }
        });
    });

    // Handle privacy toggle
    privacyToggle.addEventListener('change', (e) => {
        const isPrivacy = e.target.checked;
        chrome.runtime.sendMessage({
            type: 'TOGGLE_PRIVACY_MODE',
            privacyMode: isPrivacy
        });
    });

    // Handle Open Dashboard
    openAppBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'http://localhost:5173/' });
    });

    function updateUI(score, state, isPrivacy, isActive) {
        scoreValue.innerText = isActive ? score : "--";

        // Mode title depends on privacy
        document.getElementById('modeTitle').innerText = isPrivacy ? "Behavioral Est. Score" : "Camera Fatigue Score";

        if (!isActive) {
            scoreCircle.style.borderColor = '#ccc';
            scoreCircle.style.color = '#888';
            focusStatus.innerText = "System: Stopped";
            focusStatus.className = "status-normal";
            alterationsList.innerHTML = "<li>Start system from dashboard to begin monitoring</li>";
            return;
        }

        let alterations = [];

        if (state === 'LOW_FATIGUE') {
            scoreCircle.style.borderColor = 'var(--success-color)';
            scoreCircle.style.color = 'var(--success-color)';
            focusStatus.innerText = "Focus: High";
            focusStatus.className = "status-normal";
            alterations.push("None");
        } else if (state === 'MEDIUM_FATIGUE') {
            scoreCircle.style.borderColor = 'var(--warning-color)';
            scoreCircle.style.color = 'var(--warning-color)';
            focusStatus.innerText = "Focus: Medium";
            focusStatus.className = "status-warning";
            alterations.push("Slight Font Increase");
            alterations.push("Slightly Reduced Brightness");
            alterations.push("Reduced Animations");
        } else if (state === 'HIGH_FATIGUE') {
            scoreCircle.style.borderColor = 'orange';
            scoreCircle.style.color = 'orange';
            focusStatus.innerText = "Focus: Low";
            focusStatus.className = "status-danger";
            alterations.push("Large Font Size");
            alterations.push("Focus Mode (Distractions Dimmed)");
            alterations.push("Reduced Brightness");
            alterations.push("Reduced Animations");
        } else if (state === 'CRITICAL_FATIGUE') {
            scoreCircle.style.borderColor = 'var(--danger-color)';
            scoreCircle.style.color = 'var(--danger-color)';
            focusStatus.innerText = "Critical Fatigue";
            focusStatus.className = "status-danger";
            alterations.push("Large Font Size");
            alterations.push("Strict Focus Mode (Hidden UI)");
            alterations.push("Significantly Reduced Brightness");
            alterations.push("Reduced Animations");
            alterations.push("Break Notification Banner");
        }

        // Add note about lock
        alterations.push("<i>State locked for 3 seconds (testing mode)</i>");

        // Update list
        alterationsList.innerHTML = alterations.map(alt => `<li>${alt}</li>`).join('');
    }
});
