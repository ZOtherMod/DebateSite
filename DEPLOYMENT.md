# Debate Platform Deployment Guide

## Overview
This project uses a separated architecture:
- **Frontend**: Static files hosted on GitHub Pages
- **Backend**: WebSocket-only server hosted on Render

## GitHub Pages Setup

### 1. Enable GitHub Pages
1. Go to your repository Settings on GitHub
2. Scroll down to "Pages" in the left sidebar
3. Under "Source", select "GitHub Actions"
4. The workflow is already configured in `.github/workflows/deploy-pages.yml`

### 2. Configure WebSocket URL
Once your backend is deployed to Render:

1. Open `frontend/config.js`
2. Replace `'wss://your-render-app-name.onrender.com'` with your actual Render WebSocket URL
3. Commit and push the changes

Example:
```javascript
const CONFIG = {
    WEBSOCKET_URL: 'wss://debate-platform-xyz123.onrender.com',
    LOCAL_WEBSOCKET_URL: 'ws://localhost:8765'
};
```

### 3. Automatic Deployment
- Every push to the main branch automatically deploys the frontend to GitHub Pages
- The deployment workflow builds and publishes the `./frontend` directory
- Your site will be available at: `https://[username].github.io/[repository-name]`

## Backend Deployment (Render)

### Quick Deploy to Render
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the build command: `pip install -r requirements.txt`
4. Set the start command: `python backend/app.py`
5. Set environment variables if needed

### Environment Detection
The frontend automatically detects the environment:
- **Local**: Connects to `ws://localhost:8765`
- **Production**: Connects to the configured Render WebSocket URL

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend
Open `frontend/login.html` in a web browser or serve with a local server:
```bash
cd frontend
python -m http.server 8080
```

## Architecture Benefits
- **Simplified Deployment**: No complex server configurations
- **Scalability**: Frontend and backend can scale independently  
- **Reliability**: Static hosting is highly reliable
- **Cost Effective**: GitHub Pages is free for public repositories

## Troubleshooting

### WebSocket Connection Issues
1. Verify the Render WebSocket URL in `config.js`
2. Check that the Render service is running
3. Ensure WebSocket connections are allowed (not HTTP-only)

### GitHub Pages Not Updating
1. Check the Actions tab for deployment status
2. Ensure the workflow has proper permissions
3. Verify the `frontend/` directory contains all necessary files

### Local Development Issues
1. Make sure the backend is running on port 8765
2. Check browser console for WebSocket connection errors
3. Verify all required Python packages are installed
