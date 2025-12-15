// Login page functionality
let isSignup = false;

// Toggle between login and signup
function toggleAuthMode() {
    isSignup = !isSignup;
    
    const emailField = document.getElementById('email');
    const confirmPasswordField = document.getElementById('confirmPassword');
    const authButton = document.getElementById('authButton');
    const toggleAuth = document.getElementById('toggleAuth');
    
    if (isSignup) {
        // Show signup fields
        emailField.classList.remove('hidden');
        confirmPasswordField.classList.remove('hidden');
        authButton.textContent = 'Create Account';
        toggleAuth.textContent = 'Back to Login';
        emailField.required = true;
        confirmPasswordField.required = true;
    } else {
        // Show login fields only
        emailField.classList.add('hidden');
        confirmPasswordField.classList.add('hidden');
        authButton.textContent = 'Sign In';
        toggleAuth.textContent = 'Sign Up';
        emailField.required = false;
        confirmPasswordField.required = false;
        emailField.value = '';
        confirmPasswordField.value = '';
    }
}

// Handle form submission
function handleAuthSubmit(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showMessage('Please enter both username and password', 'error');
        return;
    }
    
    if (isSignup) {
        const email = document.getElementById('email').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!email) {
            showMessage('Please enter your email address', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }
        
        // Send create account message
        sendWebSocketMessage({
            type: 'create_account',
            username: username,
            password: password,
            email: email
        });
    } else {
        // Send login message
        sendWebSocketMessage({
            type: 'authenticate',
            username: username,
            password: password
        });
    }
}

// Handle authentication response
function handleAuthResponse(data) {
    if (data.success) {
        const user = {
            id: data.user_id,
            username: data.username,
            mmr: data.mmr
        };
        
        localStorage.setItem('debateUser', JSON.stringify(user));
        showMessage('Login successful!', 'success');
        
        setTimeout(() => {
            navigateToMatchmaking();
        }, 1000);
    } else {
        showMessage(data.error || 'Authentication failed', 'error');
    }
}

// Handle account creation response
function handleAccountCreationResponse(data) {
    if (data.success) {
        showMessage('Account created successfully! You can now login.', 'success');
        
        // Switch to login mode after 1.5 seconds
        setTimeout(() => {
            toggleAuthMode();
        }, 1500);
    } else {
        showMessage(data.error || 'Account creation failed', 'error');
    }
}

// Initialize login page
document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    const userData = localStorage.getItem('debateUser');
    if (userData) {
        navigateToMatchmaking();
        return;
    }
    
    // Connect to WebSocket
    connectWebSocket();
    
    // Setup event handlers
    document.getElementById('authForm').addEventListener('submit', handleAuthSubmit);
    document.getElementById('toggleAuth').addEventListener('click', toggleAuthMode);
    
    // Setup WebSocket message handlers
    if (typeof addWebSocketHandler !== 'undefined') {
        addWebSocketHandler('auth_response', handleAuthResponse);
        addWebSocketHandler('account_creation_response', handleAccountCreationResponse);
    }
});
