// Start page specific functionality

function showRulesModal() {
    document.getElementById('rulesModal').classList.remove('hidden');
}

function closeRulesModal() {
    document.getElementById('rulesModal').classList.add('hidden');
}

function showScoringModal() {
    document.getElementById('scoringModal').classList.remove('hidden');
}

function closeScoringModal() {
    document.getElementById('scoringModal').classList.add('hidden');
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    const rulesModal = document.getElementById('rulesModal');
    const scoringModal = document.getElementById('scoringModal');
    
    if (e.target === rulesModal) {
        closeRulesModal();
    }
    if (e.target === scoringModal) {
        closeScoringModal();
    }
});

// Initialize start page
document.addEventListener('DOMContentLoaded', () => {
    // Header is initialized by main script.js
});
