// WebSocket configuration
const CONFIG = {
    // Use environment variable or default to localhost for development
    WEBSOCKET_URL: 'wss://debateplatform-backend.onrender.com',
    // Fallback for development
    WEBSOCKET_URL_DEV: 'ws://localhost:8765'
};

// Auto-detect if we should use development or production WebSocket
function getWebSocketURL() {
    // If we're on localhost or file://, use dev URL
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' || 
        window.location.protocol === 'file:') {
        return CONFIG.WEBSOCKET_URL_DEV;
    }
    return CONFIG.WEBSOCKET_URL;
}
