// WebSocket Manager
let appState = {
    websocket: null,
    currentUser: null,
    currentDebate: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 2000,
    isConnected: false,
    messageHandlers: {}
};

// Add message handler
function addWebSocketHandler(messageType, handler) {
    if (!appState.messageHandlers[messageType]) {
        appState.messageHandlers[messageType] = [];
    }
    appState.messageHandlers[messageType].push(handler);
}

// Connect to WebSocket
function connectWebSocket() {
    const wsUrl = getWebSocketURL();
    
    if (appState.websocket && appState.websocket.readyState === WebSocket.OPEN) {
        return;
    }
    
    try {
        appState.websocket = new WebSocket(wsUrl);
        
        appState.websocket.onopen = handleWebSocketOpen;
        appState.websocket.onmessage = handleWebSocketMessage;
        appState.websocket.onclose = handleWebSocketClose;
        appState.websocket.onerror = handleWebSocketError;
        
        updateConnectionStatus('Connecting...');
    } catch (error) {
        console.error('WebSocket connection failed:', error);
        updateConnectionStatus('Connection failed');
    }
}

function handleWebSocketOpen() {
    console.log('WebSocket connected');
    appState.isConnected = true;
    appState.reconnectAttempts = 0;
    updateConnectionStatus('Connected', true);
}

function handleWebSocketMessage(event) {
    try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        
        // Call registered handlers
        const handlers = appState.messageHandlers[data.type];
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
        
        // Global handlers
        switch (data.type) {
            case 'error':
                showMessage(data.message, 'error');
                break;
            case 'pong':
                // Handle ping response
                break;
        }
    } catch (error) {
        console.error('Error parsing WebSocket message:', error);
    }
}

function handleWebSocketClose() {
    console.log('WebSocket disconnected');
    appState.isConnected = false;
    updateConnectionStatus('Disconnected');
    
    // Attempt to reconnect
    if (appState.reconnectAttempts < appState.maxReconnectAttempts) {
        setTimeout(() => {
            appState.reconnectAttempts++;
            console.log(`Reconnection attempt ${appState.reconnectAttempts}`);
            connectWebSocket();
        }, appState.reconnectDelay);
    } else {
        updateConnectionStatus('Connection lost');
    }
}

function handleWebSocketError(error) {
    console.error('WebSocket error:', error);
    updateConnectionStatus('Connection error');
}

function sendWebSocketMessage(message) {
    if (appState.websocket && appState.websocket.readyState === WebSocket.OPEN) {
        appState.websocket.send(JSON.stringify(message));
        console.log('Sent message:', message);
    } else {
        console.error('WebSocket not connected');
        showMessage('Connection lost. Please refresh the page.', 'error');
    }
}

// Update connection status display
function updateConnectionStatus(text, isOnline = false) {
    const statusElement = document.getElementById('connectionStatus');
    const indicatorElement = document.getElementById('connectionIndicator');
    const textElement = document.getElementById('connectionText');
    
    if (textElement) textElement.textContent = text;
    
    if (indicatorElement) {
        indicatorElement.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
    }
    
    if (statusElement) {
        statusElement.style.display = isOnline ? 'none' : 'flex';
    }
}

// Utility functions
function showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('hidden');
    }
}

function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('hidden');
    }
}

function setElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}
