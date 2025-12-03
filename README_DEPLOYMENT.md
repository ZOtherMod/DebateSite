# Online Debate Platform

A real-time debate platform with WebSocket-based matchmaking, structured turn-based debates, and MMR (skill rating) system.

## 🎯 Features

- **Real-time matchmaking** based on MMR (skill level)
- **Structured debates** with preparation and turn timers
- **WebSocket communication** for instant updates
- **Turn-based arguments** (3 turns per player, 2 minutes each)
- **Complete debate logging** with downloadable transcripts
- **No judging system** - focus on discussion and skill building
- **Responsive design** with clean, minimal interface

## 🏗️ Architecture

### Backend (Python)
- **WebSockets** for real-time communication
- **SQLite database** for user accounts, debates, and topics
- **MMR-based matchmaking** with time expansion algorithm
- **Async debate session management**

### Frontend (Vanilla JavaScript)
- **HTML/CSS/JavaScript** - no frameworks needed
- **WebSocket client** for real-time updates
- **Responsive design** for desktop and mobile

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd debate-platform
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the server**
   ```bash
   cd backend
   python3 app.py
   ```

4. **Open the platform**
   - Open `index.html` in your browser
   - Or visit the server URL

### Deployment on Render

This project is configured for easy deployment on Render:

1. **Push to GitHub** (see deployment section below)
2. **Connect to Render** and deploy as a Web Service
3. **Environment**: Python 3.9+
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `cd backend && python app.py`

## 📁 Project Structure

```
debate-platform/
├── backend/                 # Python WebSocket server
│   ├── app.py              # Main server application
│   ├── database.py         # SQLite operations
│   ├── matchmaking.py      # MMR-based matchmaking
│   ├── debate_logic.py     # Debate session management
│   └── websocket_manager.py# WebSocket handling
├── frontend/               # Client-side application
│   ├── login.html         # Authentication page
│   ├── matchmaking.html   # Lobby and queue
│   ├── debate.html        # Live debate interface
│   ├── end.html          # Results and transcript
│   ├── style.css         # Styling
│   └── script.js         # Client logic
├── database/              # SQLite files (auto-created)
├── index.html            # Landing page
├── requirements.txt      # Python dependencies
├── render.yaml          # Render deployment config
└── README.md           # This file
```

## 🎮 How to Use

### 1. **Create Account**
- Visit the platform and click "Start Debating"
- Create a new account with username (3+ chars) and password (6+ chars)
- Starting MMR: 1000

### 2. **Find Opponents**
- Click "Start Matchmaking" to join the queue
- System matches players with similar MMR
- Wait times expand MMR range for faster matches

### 3. **Debate Structure**
- **Preparation**: 3 minutes to prepare arguments
- **Debate**: Turn-based arguments (2 minutes per turn)
- **Turns**: 3 arguments per player (6 total)
- **Logging**: All arguments saved with timestamps

### 4. **Review Results**
- View complete debate transcript
- Download text file of the debate
- Return to lobby for more debates

## 🌐 Deployment Guide

### GitHub Setup

1. **Initialize Git** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Online Debate Platform"
   ```

2. **Create GitHub repository**
   - Go to GitHub and create a new repository
   - Add the remote origin:
   ```bash
   git remote add origin https://github.com/yourusername/debate-platform.git
   git branch -M main
   git push -u origin main
   ```

### Render Deployment

1. **Connect GitHub** to Render
2. **Create Web Service** from your repository
3. **Configure settings**:
   - **Environment**: Python 3.9+
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd backend && python app.py`
   - **Port**: Use Render's PORT environment variable

4. **Update WebSocket URL** in `frontend/script.js` for production

## 📝 License

MIT License - feel free to use and modify for your projects.

---

**Happy Debating! 🎯**
