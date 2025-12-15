// Debate page functionality
let debateId = null;
let currentDebateState = null;
let timerInterval = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeDebatePage();
});

function initializeDebatePage() {
    // Get debate ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    debateId = urlParams.get('debate_id') || localStorage.getItem('currentDebateId');
    
    if (!debateId) {
        showError('No debate ID found. Redirecting to matchmaking...');
        setTimeout(() => {
            window.location.href = 'matchmaking.html';
        }, 2000);
        return;
    }

    checkAuthentication();
    setupDebateControls();
    setupWebSocketHandlers();
    
    // Load current user data
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        currentUser = userData;
    }
    
    // Join the debate
    joinDebate();
}

function setupDebateControls() {
    const argumentInput = document.getElementById('argumentInput');
    const submitButton = document.getElementById('submitButton');
    const forfeitButton = document.getElementById('forfeitButton');
    const charCount = document.getElementById('charCount');
    
    // Character counter
    if (argumentInput && charCount) {
        argumentInput.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            
            if (submitButton) {
                submitButton.disabled = count === 0 || count > 1000;
            }
        });
    }
    
    // Submit argument
    if (submitButton) {
        submitButton.addEventListener('click', submitArgument);
    }
    
    // Forfeit button
    if (forfeitButton) {
        forfeitButton.addEventListener('click', showForfeitModal);
    }
    
    // Forfeit modal
    const confirmForfeit = document.getElementById('confirmForfeit');
    const cancelForfeit = document.getElementById('cancelForfeit');
    
    if (confirmForfeit) {
        confirmForfeit.addEventListener('click', confirmForfeitDebate);
    }
    
    if (cancelForfeit) {
        cancelForfeit.addEventListener('click', hideForfeitModal);
    }
}

function setupWebSocketHandlers() {
    // Override WebSocket message handler for debate
    const originalOnMessage = WebSocketManager.onMessage;
    
    WebSocketManager.onMessage = function(event) {
        const data = JSON.parse(event.data);
        
        switch(data.type) {
            case 'debate_joined':
                handleDebateJoined(data);
                break;
            case 'debate_state_update':
                handleDebateStateUpdate(data);
                break;
            case 'argument_submitted':
                handleArgumentSubmitted(data);
                break;
            case 'timer_update':
                handleTimerUpdate(data);
                break;
            case 'debate_ended':
                handleDebateEnded(data);
                break;
            case 'player_forfeited':
                handlePlayerForfeited(data);
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

function joinDebate() {
    if (!WebSocketManager.isConnected()) {
        showError('Not connected to server. Please refresh the page.');
        return;
    }

    if (!currentUser) {
        showError('Please log in first.');
        window.location.href = 'login.html';
        return;
    }

    WebSocketManager.send({
        type: 'join_debate',
        debate_id: debateId,
        user_id: currentUser.user_id
    });
}

function submitArgument() {
    const argumentInput = document.getElementById('argumentInput');
    const argument = argumentInput.value.trim();
    
    if (!argument) {
        showError('Please enter an argument.');
        return;
    }
    
    if (argument.length > 1000) {
        showError('Argument is too long. Maximum 1000 characters.');
        return;
    }

    WebSocketManager.send({
        type: 'submit_argument',
        debate_id: debateId,
        user_id: currentUser.user_id,
        argument: argument
    });
    
    // Clear input and disable submit button
    argumentInput.value = '';
    document.getElementById('charCount').textContent = '0';
    document.getElementById('submitButton').disabled = true;
}

function confirmForfeitDebate() {
    WebSocketManager.send({
        type: 'forfeit_debate',
        debate_id: debateId,
        user_id: currentUser.user_id
    });
    
    hideForfeitModal();
}

function showForfeitModal() {
    document.getElementById('forfeitModal').classList.remove('hidden');
}

function hideForfeitModal() {
    document.getElementById('forfeitModal').classList.add('hidden');
}

function handleDebateJoined(data) {
    currentDebateState = data.debate_state;
    updateDebateUI();
    console.log('Joined debate:', data);
}

function handleDebateStateUpdate(data) {
    currentDebateState = data.debate_state;
    updateDebateUI();
}

function handleArgumentSubmitted(data) {
    addArgumentToDisplay(data);
    
    // Update debate state if provided
    if (data.debate_state) {
        currentDebateState = data.debate_state;
        updateDebateUI();
    }
}

function handleTimerUpdate(data) {
    updateTimer(data.remaining_time);
}

function handleDebateEnded(data) {
    clearInterval(timerInterval);
    
    // Store results for end page
    localStorage.setItem('debateResults', JSON.stringify(data));
    
    // Redirect to results page
    setTimeout(() => {
        window.location.href = `end.html?debate_id=${debateId}`;
    }, 2000);
}

function handlePlayerForfeited(data) {
    showError(`${data.player_name} has forfeited the debate.`);
    
    // Handle like debate ended
    setTimeout(() => {
        handleDebateEnded(data);
    }, 3000);
}

function updateDebateUI() {
    if (!currentDebateState) return;
    
    // Update topic
    const topicElement = document.getElementById('debateTopic');
    if (topicElement && currentDebateState.topic) {
        topicElement.textContent = currentDebateState.topic;
    }
    
    // Update phase
    const phaseElement = document.getElementById('debatePhase');
    if (phaseElement) {
        phaseElement.textContent = currentDebateState.phase || 'In Progress';
    }
    
    // Update players
    updatePlayersInfo();
    
    // Update turn indicators
    updateTurnIndicators();
    
    // Update input area
    updateInputArea();
    
    // Update timer
    if (currentDebateState.remaining_time !== undefined) {
        updateTimer(currentDebateState.remaining_time);
    }
}

function updatePlayersInfo() {
    if (!currentDebateState.players) return;
    
    const players = currentDebateState.players;
    
    // Player 1
    const player1Name = document.getElementById('player1Name');
    const player1Side = document.getElementById('player1Side');
    const player1MMR = document.getElementById('player1MMR');
    
    if (players[0]) {
        if (player1Name) player1Name.textContent = players[0].username;
        if (player1Side) player1Side.textContent = players[0].side;
        if (player1MMR) player1MMR.textContent = `MMR: ${players[0].mmr}`;
        
        // Highlight current user
        const card1 = document.getElementById('playerCard1');
        if (card1) {
            card1.classList.toggle('current-user', players[0].user_id === currentUser.user_id);
        }
    }
    
    // Player 2
    const player2Name = document.getElementById('player2Name');
    const player2Side = document.getElementById('player2Side');
    const player2MMR = document.getElementById('player2MMR');
    
    if (players[1]) {
        if (player2Name) player2Name.textContent = players[1].username;
        if (player2Side) player2Side.textContent = players[1].side;
        if (player2MMR) player2MMR.textContent = `MMR: ${players[1].mmr}`;
        
        // Highlight current user
        const card2 = document.getElementById('playerCard2');
        if (card2) {
            card2.classList.toggle('current-user', players[1].user_id === currentUser.user_id);
        }
    }
}

function updateTurnIndicators() {
    if (!currentDebateState.current_turn) return;
    
    const turn1 = document.getElementById('turn1');
    const turn2 = document.getElementById('turn2');
    const currentTurnUserId = currentDebateState.current_turn;
    
    if (currentDebateState.players) {
        const isPlayer1Turn = currentDebateState.players[0] && currentDebateState.players[0].user_id === currentTurnUserId;
        const isPlayer2Turn = currentDebateState.players[1] && currentDebateState.players[1].user_id === currentTurnUserId;
        
        if (turn1) {
            turn1.classList.toggle('active', isPlayer1Turn);
            turn1.querySelector('.turn-text').textContent = isPlayer1Turn ? 'Your Turn' : 'Waiting';
        }
        
        if (turn2) {
            turn2.classList.toggle('active', isPlayer2Turn);
            turn2.querySelector('.turn-text').textContent = isPlayer2Turn ? 'Your Turn' : 'Waiting';
        }
    }
}

function updateInputArea() {
    const inputArea = document.getElementById('inputArea');
    const waitingMessage = document.getElementById('waitingMessage');
    const isMyTurn = currentDebateState.current_turn === currentUser.user_id;
    
    if (inputArea) {
        inputArea.style.display = isMyTurn ? 'block' : 'none';
    }
    
    if (waitingMessage) {
        waitingMessage.classList.toggle('hidden', isMyTurn);
    }
}

function updateTimer(remainingTime) {
    const timerValue = document.getElementById('timerValue');
    if (timerValue && remainingTime !== undefined) {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        timerValue.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Add warning class for low time
        timerValue.classList.toggle('warning', remainingTime <= 30);
    }
}

function addArgumentToDisplay(data) {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'debate-message';
    
    const isCurrentUser = data.user_id === currentUser.user_id;
    messageElement.classList.add(isCurrentUser ? 'own-message' : 'opponent-message');
    
    messageElement.innerHTML = `
        <div class="message-header">
            <span class="message-author">${data.username}</span>
            <span class="message-side">(${data.side})</span>
            <span class="message-time">${new Date(data.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="message-content">${escapeHtml(data.argument)}</div>
    `;
    
    messagesList.appendChild(messageElement);
    messagesList.scrollTop = messagesList.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function handleError(message) {
    showError(message);
}

function showError(message) {
    console.error('Debate error:', message);
    
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
    if (timerInterval) {
        clearInterval(timerInterval);
    }
});

// Add CSS for animations and styles
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
    
    .debate-message {
        margin-bottom: 15px;
        padding: 15px;
        border-radius: 8px;
        background: #f8f9fa;
    }
    
    .own-message {
        background: #e3f2fd;
        margin-left: 20px;
    }
    
    .opponent-message {
        background: #fff3e0;
        margin-right: 20px;
    }
    
    .message-header {
        display: flex;
        gap: 10px;
        margin-bottom: 8px;
        font-size: 14px;
        color: #666;
    }
    
    .message-author {
        font-weight: 600;
        color: #333;
    }
    
    .message-side {
        color: #007bff;
        font-weight: 500;
    }
    
    .message-content {
        font-size: 16px;
        line-height: 1.5;
        color: #333;
        white-space: pre-wrap;
    }
    
    .timer-value.warning {
        color: #ff4757;
        animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
    }
    
    .turn-indicator.active {
        background: #28a745;
        color: white;
    }
    
    .player-card.current-user {
        border: 2px solid #007bff;
        background: rgba(0, 123, 255, 0.05);
    }
`;
document.head.appendChild(style);
