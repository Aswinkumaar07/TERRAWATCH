/**
 * auth.js - Frontend Authentication Logic for BioAdaptive
 * Handles mock login, signup, and session management.
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    // --- Login Logic ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Simple mock validation (accepts any non-empty password)
            if (email && password.length >= 4) {
                simulateAuthSuccess(email, "Login Successful");
            } else {
                handleAuthError(loginForm, "Invalid email or password");
            }
        });
    }

    // --- Signup Logic ---
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullname = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;
            const dob = document.getElementById('dob').value;
            const password = document.getElementById('password').value;

            if (fullname && email && dob && password.length >= 6) {
                simulateAuthSuccess(email, "Account Created Successfully");
            } else {
                handleAuthError(signupForm, "Please fill all fields correctly (Password min 6 chars)");
            }
        });
    }

    // --- Social Auth ---
    const googleAuthBtn = document.getElementById('googleAuthBtn');
    if (googleAuthBtn) {
        googleAuthBtn.addEventListener('click', () => {
            simulateAuthSuccess("google_user@gmail.com", "Signed in with Google");
        });
    }
});

/**
 * Simulates a successful authentication event.
 */
function simulateAuthSuccess(email, message) {
    // Save session in localStorage
    localStorage.setItem('bio_adaptive_user', JSON.stringify({
        email: email,
        isLoggedIn: true,
        loginTime: new Date().getTime()
    }));

    // Show success state (optional visual feedback before redirect)
    const submitBtn = document.querySelector('.auth-submit');
    if (submitBtn) {
        submitBtn.innerHTML = `<span>Just a moment...</span>`;
        submitBtn.style.opacity = '0.7';
        submitBtn.disabled = true;
    }

    // Redirect to dashboard after a short delay for feel
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 800);
}

/**
 * Handles authentication errors with a shake animation.
 */
function handleAuthError(form, message) {
    const card = form.closest('.auth-card');
    card.classList.add('error-shake');
    
    // Add temporary error message if not exists
    let errorMsg = card.querySelector('.error-banner');
    if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.className = 'error-banner';
        card.prepend(errorMsg);
    }
    errorMsg.innerText = message;
    errorMsg.style.display = 'block';

    setTimeout(() => {
        card.classList.remove('error-shake');
    }, 500);
}

/**
 * Public logout function
 */
function logout() {
    localStorage.removeItem('bio_adaptive_user');
    window.location.href = 'login.html';
}

/**
 * Auth Guard - Check if user is logged in
 * Call this at the start of index.html scripts
 */
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('bio_adaptive_user'));
    
    // Allow access only if logged in OR if specifically on auth pages
    const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html');
    
    if (!user && !isAuthPage) {
        window.location.href = 'login.html';
    } else if (user && isAuthPage) {
        // Already logged in, go to dashboard
        window.location.href = 'index.html';
    }
}
