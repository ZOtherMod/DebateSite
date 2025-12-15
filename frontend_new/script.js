// Navigation functions
function navigateToStart() {
    window.location.href = 'start.html';
}

function navigateToLogin() {
    window.location.href = 'login.html';
}

function navigateToHome() {
    window.location.href = 'index.html';
}

function navigateToAbout() {
    window.location.href = 'about.html';
}

function navigateToMatchmaking() {
    window.location.href = 'matchmaking.html';
}

function navigateToDebate() {
    window.location.href = 'debate.html';
}

function navigateToEnd() {
    window.location.href = 'end.html';
}

// Header functionality
function initializeHeader() {
    const userData = localStorage.getItem('debateUser');
    const profileWrapper = document.getElementById('profileWrapper');
    const signInLink = document.getElementById('signInLink');
    const profilePhoto = document.getElementById('profilePhoto');
    const loginContainer = document.getElementById('loginContainer');
    
    if (userData && profileWrapper && signInLink) {
        const user = JSON.parse(userData);
        
        // Show user profile, hide sign in
        profileWrapper.classList.remove('hidden');
        signInLink.classList.add('hidden');
        
        // Update user info
        const usernameDisplay = document.getElementById('usernameDisplay');
        const mmrDisplay = document.getElementById('mmrDisplay');
        
        if (usernameDisplay) usernameDisplay.textContent = `Welcome, ${user.username}`;
        if (mmrDisplay) mmrDisplay.textContent = `MMR: ${user.mmr}`;
        
        // Profile photo click handler
        if (profilePhoto) {
            profilePhoto.addEventListener('click', () => {
                loginContainer.classList.toggle('hidden');
            });
        }
        
        // Logout button handler
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileWrapper.contains(e.target)) {
                loginContainer.classList.add('hidden');
            }
        });
    } else if (profileWrapper && signInLink) {
        // Show sign in, hide profile
        profileWrapper.classList.add('hidden');
        signInLink.classList.remove('hidden');
    }
}

function handleLogout() {
    localStorage.removeItem('debateUser');
    localStorage.removeItem('currentDebate');
    localStorage.removeItem('finalDebateData');
    window.location.href = 'index.html';
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeHeader();
});

// Message display functions
function showMessage(message, type = 'info') {
    // Create message element if it doesn't exist
    let messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'messageContainer';
        messageContainer.className = 'message-container';
        messageContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
        `;
        document.body.appendChild(messageContainer);
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    messageElement.style.cssText = `
        padding: 1rem 1.5rem;
        border-radius: 8px;
        margin-bottom: 0.5rem;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        background-color: ${type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : '#d1ecf1'};
        color: ${type === 'error' ? '#721c24' : type === 'success' ? '#155724' : '#0c5460'};
        border: 1px solid ${type === 'error' ? '#f5c6cb' : type === 'success' ? '#c3e6cb' : '#bee5eb'};
    `;
    
    messageContainer.appendChild(messageElement);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 3000);
}
