// Matchmaking page functionality
let isInQueue = false;
let matchmakingStartTime = null;
let queueTimer = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeMatchmakingPage();
});

function initializeMatchmakingPage() {
    checkAuthentication();
    setupMatchmakingButtons();
    setupWebSocketHandlers();
}

function setupMatchmakingButtons() {
    const startButton = document.getElementById('startMatchmakingButton');
    const stopButton = document.getElementById('stopMatchmakingButton');
    const proceedButton = document.getElementById('proceedToDebateButton');

    if (startButton) {
        startButton.addEventListener('click', startMatchmaking);
    }
    
    if (stopButton) {
        stopButton.addEventListener('click', stopMatchmaking);
    }
    
    if (proceedButton) {
        proceedButton.addEventListener('click', proceedToDebate);
    }
}

function setupWebSocketHandlers() {
    // Override WebSocket message handler for matchmaking
    const originalOnMessage = WebSocketManager.onMessage;
    
    WebSocketManager.onMessage = function(event) {
        const data = JSON.parse(event.data);
        
        switch(data.type) {
            case 'matchmaking_started':
                handleMatchmakingStarted();
                break;
            case 'matchmaking_stopped':
                handleMatchmakingStopped();
                break;
            case 'queue_status':
                updateQueueStatus(data.position, data.total);
                break;
            case 'match_found':
                handleMatchFound(data);
                break;
            case 'debate_starting':
                handleDebateStarting(data.debate_id);
                break;
            case 'error':
                handleError(data.message);
                break;
            default:
                // Call original handler for other messages
                if (originalOnMessage) {
                    originalOnMessage.call(this, event);
                }
                break;
        }
    };
}

function startMatchmaking() {
    if (!WebSocketManager.isConnected()) {
        showError('Not connected to server. Please refresh the page.');
        return;
    }

    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
        showError('Please log in first.');
        window.location.href = 'login.html';
        return;
    }

    WebSocketManager.send({
        type: 'start_matchmaking',
        user_id: userData.user_id
    });
}

function stopMatchmaking() {
    if (!WebSocketManager.isConnected()) {
        return;
    }

    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
        return;
    }

    WebSocketManager.send({
        type: 'stop_matchmaking',
        user_id: userData.user_id
    });
}

function proceedToDebate() {
    const matchData = JSON.parse(localStorage.getItem('currentMatch'));
    if (matchData && matchData.debate_id) {
        window.location.href = `debate.html?debate_id=${matchData.debate_id}`;
    } else {
        showError('No active match found.');
    }
}

function handleMatchmakingStarted() {
    isInQueue = true;
    matchmakingStartTime = Date.now();
    
    // Update UI
    document.getElementById('startMatchmakingButton').classList.add('hidden');
    document.getElementById('stopMatchmakingButton').classList.remove('hidden');
    document.getElementById('statusContainer').classList.remove('hidden');
    document.getElementById('matchFoundContainer').classList.add('hidden');
    
    // Start queue timer
    updateQueueTime();
    queueTimer = setInterval(updateQueueTime, 1000);
    
    console.log('Matchmaking started');
}

function handleMatchmakingStopped() {
    isInQueue = false;
    matchmakingStartTime = null;
    
    // Clear timer
    if (queueTimer) {
        clearInterval(queueTimer);
        queueTimer = null;
    }
    
    // Update UI
    document.getElementById('startMatchmakingButton').classList.remove('hidden');
    document.getElementById('stopMatchmakingButton').classList.add('hidden');
    document.getElementById('statusContainer').classList.add('hidden');
    document.getElementById('matchFoundContainer').classList.add('hidden');
    
    console.log('Matchmaking stopped');
}

function updateQueueStatus(position, total) {
    const queueStatus = document.getElementById('queueStatus');
    if (queueStatus) {
        queueStatus.textContent = `Queue position: ${position}/${total}`;
    }
}

function updateQueueTime() {
    if (!matchmakingStartTime) return;
    
    const elapsed = Math.floor((Date.now() - matchmakingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    const statusText = document.getElementById('statusText');
    if (statusText) {
        statusText.textContent = `Searching for opponent... ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function handleMatchFound(data) {
    isInQueue = false;
    
    // Clear timer
    if (queueTimer) {
        clearInterval(queueTimer);
        queueTimer = null;
    }
    
    // Store match data
    localStorage.setItem('currentMatch', JSON.stringify(data));
    
    // Update UI
    document.getElementById('statusContainer').classList.add('hidden');
    document.getElementById('matchFoundContainer').classList.remove('hidden');
    
    // Update opponent info
    const opponentUsername = document.getElementById('opponentUsername');
    const opponentMMR = document.getElementById('opponentMMR');
    const debateTopic = document.getElementById('debateTopic');
    
    if (opponentUsername) {
        opponentUsername.textContent = data.opponent_username || 'Unknown';
    }
    
    if (opponentMMR) {
        opponentMMR.textContent = data.opponent_mmr || 'Unknown';
    }
    
    if (debateTopic) {
        debateTopic.textContent = data.topic || 'No topic assigned';
    }
    
    console.log('Match found:', data);
}

function handleDebateStarting(debateId) {
    localStorage.setItem('currentDebateId', debateId);
    window.location.href = `debate.html?debate_id=${debateId}`;
}

function handleError(message) {
    showError(message);
    
    // Reset matchmaking state on error
    if (isInQueue) {
        handleMatchmakingStopped();
    }
}

function showError(message) {
    console.error('Matchmaking error:', message);
    
    // Create error toast
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4757;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (isInQueue) {
        stopMatchmaking();
    }
});

// Add CSS for error toast animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
