// End results page functionality
let debateResults = null;
let currentUser = null;
let debateId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeEndPage();
});

function initializeEndPage() {
    // Get debate ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    debateId = urlParams.get('debate_id');
    
    checkAuthentication();
    
    // Load current user data
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        currentUser = userData;
    } else {
        showError('Please log in first.');
        window.location.href = 'login.html';
        return;
    }
    
    // Load debate results
    loadDebateResults();
    
    // Setup event listeners
    setupEventListeners();
}

function loadDebateResults() {
    // Try to get results from localStorage first
    const storedResults = localStorage.getItem('debateResults');
    
    if (storedResults) {
        debateResults = JSON.parse(storedResults);
        displayResults();
    } else if (debateId) {
        // If no stored results but we have debate ID, fetch from server
        fetchDebateResults(debateId);
    } else {
        showError('No debate results found. Redirecting to home...');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    }
}

function fetchDebateResults(debateId) {
    if (!WebSocketManager.isConnected()) {
        showError('Not connected to server. Please refresh the page.');
        return;
    }

    WebSocketManager.send({
        type: 'get_debate_results',
        debate_id: debateId,
        user_id: currentUser.user_id
    });
    
    // Set up one-time listener for results
    const originalOnMessage = WebSocketManager.onMessage;
    
    WebSocketManager.onMessage = function(event) {
        const data = JSON.parse(event.data);
        
        if (data.type === 'debate_results') {
            debateResults = data;
            displayResults();
            // Restore original handler
            WebSocketManager.onMessage = originalOnMessage;
        } else if (data.type === 'error') {
            showError(data.message);
            // Restore original handler
            WebSocketManager.onMessage = originalOnMessage;
        } else if (originalOnMessage) {
            originalOnMessage.call(this, event);
        }
    };
}

function setupEventListeners() {
    const playAgainButton = document.getElementById('playAgainButton');
    const viewProfileButton = document.getElementById('viewProfileButton');
    const shareResultButton = document.getElementById('shareResultButton');
    const argumentsToggle = document.getElementById('argumentsToggle');
    
    if (playAgainButton) {
        playAgainButton.addEventListener('click', () => {
            window.location.href = 'matchmaking.html';
        });
    }
    
    if (viewProfileButton) {
        viewProfileButton.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }
    
    if (shareResultButton) {
        shareResultButton.addEventListener('click', showShareModal);
    }
    
    if (argumentsToggle) {
        argumentsToggle.addEventListener('click', toggleArguments);
    }
    
    // Share modal listeners
    setupShareModalListeners();
}

function setupShareModalListeners() {
    const closeShareModal = document.getElementById('closeShareModal');
    const copyLinkButton = document.getElementById('copyLinkButton');
    const shareTwitterButton = document.getElementById('shareTwitterButton');
    const shareRedditButton = document.getElementById('shareRedditButton');
    
    if (closeShareModal) {
        closeShareModal.addEventListener('click', hideShareModal);
    }
    
    if (copyLinkButton) {
        copyLinkButton.addEventListener('click', copyResultLink);
    }
    
    if (shareTwitterButton) {
        shareTwitterButton.addEventListener('click', shareOnTwitter);
    }
    
    if (shareRedditButton) {
        shareRedditButton.addEventListener('click', shareOnReddit);
    }
    
    // Close modal on backdrop click
    const shareModal = document.getElementById('shareModal');
    if (shareModal) {
        shareModal.addEventListener('click', function(e) {
            if (e.target === shareModal) {
                hideShareModal();
            }
        });
    }
}

function displayResults() {
    if (!debateResults) return;
    
    displayResultStatus();
    displayDebateSummary();
    displayPlayerResults();
    displayPerformanceStats();
    displayArguments();
}

function displayResultStatus() {
    const resultTitle = document.getElementById('resultTitle');
    const resultText = document.getElementById('resultText');
    const resultBadge = document.getElementById('resultBadge');
    
    const didWin = debateResults.winner_id === currentUser.user_id;
    const wasForfeited = debateResults.reason === 'forfeit';
    const wasTimeout = debateResults.reason === 'timeout';
    
    let title, badge, badgeClass;
    
    if (wasForfeited) {
        if (didWin) {
            title = 'Victory by Forfeit!';
            badge = 'Opponent Forfeited';
            badgeClass = 'victory-forfeit';
        } else {
            title = 'Defeat by Forfeit';
            badge = 'You Forfeited';
            badgeClass = 'defeat-forfeit';
        }
    } else if (wasTimeout) {
        if (didWin) {
            title = 'Victory by Timeout!';
            badge = 'Time Victory';
            badgeClass = 'victory-timeout';
        } else {
            title = 'Defeat by Timeout';
            badge = 'Time Defeat';
            badgeClass = 'defeat-timeout';
        }
    } else {
        if (didWin) {
            title = 'Victory!';
            badge = 'Winner';
            badgeClass = 'victory';
        } else {
            title = 'Defeat';
            badge = 'Loss';
            badgeClass = 'defeat';
        }
    }
    
    if (resultTitle) resultTitle.textContent = title;
    if (resultText) resultText.textContent = badge;
    if (resultBadge) {
        resultBadge.className = `result-badge ${badgeClass}`;
    }
}

function displayDebateSummary() {
    const topicElement = document.getElementById('debateTopic');
    const durationElement = document.getElementById('debateDuration');
    const argumentsElement = document.getElementById('totalArguments');
    
    if (topicElement && debateResults.topic) {
        topicElement.textContent = debateResults.topic;
    }
    
    if (durationElement && debateResults.duration) {
        const minutes = Math.floor(debateResults.duration / 60);
        const seconds = debateResults.duration % 60;
        durationElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    if (argumentsElement && debateResults.arguments) {
        argumentsElement.textContent = debateResults.arguments.length.toString();
    }
}

function displayPlayerResults() {
    if (!debateResults.players || debateResults.players.length !== 2) return;
    
    const winner = debateResults.players.find(p => p.user_id === debateResults.winner_id);
    const loser = debateResults.players.find(p => p.user_id !== debateResults.winner_id);
    
    if (winner) {
        updatePlayerCard('winner', winner, true);
    }
    
    if (loser) {
        updatePlayerCard('loser', loser, false);
    }
}

function updatePlayerCard(cardType, player, isWinner) {
    const nameElement = document.getElementById(`${cardType}Name`);
    const sideElement = document.getElementById(`${cardType}Side`);
    const mmrChangeElement = document.getElementById(`${cardType}MMRChange`);
    const newMMRElement = document.getElementById(`${cardType}NewMMR`);
    
    if (nameElement) nameElement.textContent = player.username;
    if (sideElement) sideElement.textContent = player.side;
    
    if (mmrChangeElement && player.mmr_change !== undefined) {
        const change = player.mmr_change;
        mmrChangeElement.textContent = `${change > 0 ? '+' : ''}${change} MMR`;
        mmrChangeElement.className = `mmr-change ${change > 0 ? 'positive' : 'negative'}`;
    }
    
    if (newMMRElement && player.new_mmr !== undefined) {
        newMMRElement.textContent = `New MMR: ${player.new_mmr}`;
    }
}

function displayPerformanceStats() {
    if (!currentUser) return;
    
    const currentPlayerData = debateResults.players?.find(p => p.user_id === currentUser.user_id);
    if (!currentPlayerData) return;
    
    const yourArguments = document.getElementById('yourArguments');
    const mmrChangeElement = document.getElementById('mmrChange');
    const newMMRElement = document.getElementById('newMMR');
    const debateRankElement = document.getElementById('debateRank');
    
    if (yourArguments && debateResults.arguments) {
        const userArguments = debateResults.arguments.filter(arg => arg.user_id === currentUser.user_id);
        yourArguments.textContent = userArguments.length.toString();
    }
    
    if (mmrChangeElement && currentPlayerData.mmr_change !== undefined) {
        const change = currentPlayerData.mmr_change;
        mmrChangeElement.textContent = `${change > 0 ? '+' : ''}${change}`;
        mmrChangeElement.className = `stat-value ${change > 0 ? 'positive' : 'negative'}`;
    }
    
    if (newMMRElement && currentPlayerData.new_mmr !== undefined) {
        newMMRElement.textContent = currentPlayerData.new_mmr.toString();
    }
    
    if (debateRankElement && currentPlayerData.new_mmr !== undefined) {
        debateRankElement.textContent = calculateRank(currentPlayerData.new_mmr);
    }
}

function displayArguments() {
    const argumentsList = document.getElementById('argumentsList');
    if (!argumentsList || !debateResults.arguments) return;
    
    argumentsList.innerHTML = '';
    
    debateResults.arguments.forEach((arg, index) => {
        const argElement = document.createElement('div');
        argElement.className = 'argument-item';
        
        const isCurrentUser = arg.user_id === currentUser.user_id;
        argElement.classList.add(isCurrentUser ? 'own-argument' : 'opponent-argument');
        
        argElement.innerHTML = `
            <div class="argument-header">
                <span class="argument-number">#${index + 1}</span>
                <span class="argument-author">${arg.username}</span>
                <span class="argument-side">(${arg.side})</span>
                <span class="argument-time">${new Date(arg.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="argument-content">${escapeHtml(arg.argument)}</div>
        `;
        
        argumentsList.appendChild(argElement);
    });
}

function calculateRank(mmr) {
    if (mmr >= 2000) return 'Master';
    if (mmr >= 1500) return 'Expert';
    if (mmr >= 1200) return 'Advanced';
    if (mmr >= 1000) return 'Intermediate';
    if (mmr >= 800) return 'Novice';
    return 'Beginner';
}

function toggleArguments() {
    const content = document.getElementById('argumentsContent');
    const icon = document.querySelector('#argumentsToggle .toggle-icon');
    
    if (content && icon) {
        content.classList.toggle('hidden');
        icon.textContent = content.classList.contains('hidden') ? '▼' : '▲';
    }
}

function showShareModal() {
    document.getElementById('shareModal').classList.remove('hidden');
}

function hideShareModal() {
    document.getElementById('shareModal').classList.add('hidden');
}

function copyResultLink() {
    const url = `${window.location.origin}/end.html?debate_id=${debateId}`;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showSuccess('Link copied to clipboard!');
        }).catch(() => {
            fallbackCopyLink(url);
        });
    } else {
        fallbackCopyLink(url);
    }
}

function fallbackCopyLink(url) {
    // Create temporary textarea for fallback copy
    const textarea = document.createElement('textarea');
    textarea.value = url;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showSuccess('Link copied to clipboard!');
    } catch (err) {
        showError('Failed to copy link. Please copy manually: ' + url);
    }
    
    document.body.removeChild(textarea);
}

function shareOnTwitter() {
    const didWin = debateResults.winner_id === currentUser.user_id;
    const result = didWin ? 'won' : 'lost';
    const text = `I just ${result} a debate on DebateHub! Topic: "${debateResults.topic}" 🎯`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    
    window.open(url, '_blank', 'width=600,height=400');
}

function shareOnReddit() {
    const didWin = debateResults.winner_id === currentUser.user_id;
    const result = didWin ? 'Victory' : 'Challenging debate';
    const title = `${result} on DebateHub: "${debateResults.topic}"`;
    const url = `https://reddit.com/submit?title=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`;
    
    window.open(url, '_blank', 'width=800,height=600');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    console.error('End page error:', message);
    
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

function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ed573;
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
    }, 3000);
}

// Add CSS for end page specific styles
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
    
    .result-badge.victory {
        background: linear-gradient(135deg, #2ed573, #17c0eb);
        color: white;
    }
    
    .result-badge.defeat {
        background: linear-gradient(135deg, #ff4757, #ff3742);
        color: white;
    }
    
    .result-badge.victory-forfeit,
    .result-badge.victory-timeout {
        background: linear-gradient(135deg, #ffa502, #ff6348);
        color: white;
    }
    
    .result-badge.defeat-forfeit,
    .result-badge.defeat-timeout {
        background: linear-gradient(135deg, #747d8c, #57606f);
        color: white;
    }
    
    .stat-value.positive {
        color: #2ed573;
    }
    
    .stat-value.negative {
        color: #ff4757;
    }
    
    .mmr-change.positive {
        color: #2ed573;
    }
    
    .mmr-change.negative {
        color: #ff4757;
    }
    
    .player-result.winner {
        border: 2px solid #2ed573;
        background: rgba(46, 213, 115, 0.1);
    }
    
    .player-result.loser {
        border: 2px solid #ddd;
        background: rgba(0, 0, 0, 0.05);
    }
    
    .result-crown {
        font-size: 32px;
        margin-bottom: 10px;
    }
    
    .argument-item {
        margin-bottom: 15px;
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid #007bff;
    }
    
    .own-argument {
        background: #e3f2fd;
        border-left-color: #2196f3;
    }
    
    .opponent-argument {
        background: #fff3e0;
        border-left-color: #ff9800;
    }
    
    .argument-header {
        display: flex;
        gap: 10px;
        margin-bottom: 8px;
        font-size: 14px;
        color: #666;
    }
    
    .argument-number {
        font-weight: bold;
        color: #333;
    }
    
    .argument-author {
        font-weight: 600;
        color: #333;
    }
    
    .argument-side {
        color: #007bff;
        font-weight: 500;
    }
    
    .argument-content {
        font-size: 16px;
        line-height: 1.5;
        color: #333;
        white-space: pre-wrap;
    }
    
    .collapsible-header {
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        padding: 15px 0;
        font-size: inherit;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .collapsible-header:hover {
        color: #007bff;
    }
    
    .toggle-icon {
        font-size: 18px;
        transition: transform 0.2s ease;
    }
`;
document.head.appendChild(style);
