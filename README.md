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

### Frontend
- **HTML** - Page structure
- **CSS** - Minimal styling
- **JavaScript** - WebSocket handling and interactivity

## File Structure

```
/
├── backend/
│   ├── app.py                 # Main server application
│   ├── database.py            # Database operations
│   ├── matchmaking.py         # MMR-based matchmaking logic
│   ├── debate_logic.py        # Debate session management
│   └── websocket_manager.py   # WebSocket connection handling
├── frontend/
│   ├── login.html            # Authentication page
│   ├── matchmaking.html      # Opponent matching interface
│   ├── debate.html           # Live debate session
│   ├── end.html              # Post-debate summary
│   ├── style.css             # Application styling
│   └── script.js             # Client-side functionality
├── database/
│   └── app.db                # SQLite database (auto-created)
├── requirements.txt          # Python dependencies
├── package.json              # Project configuration
└── README.md                 # This file
```

## Database Schema

### Users Table
- `id` (Primary Key) - User account number
- `username` (Unique) - User display name
- `password_hash` - SHA-256 hashed password
- `mmr` (Default: 1000) - Matchmaking rating

### Debates Table
- `id` (Primary Key) - Debate session ID
- `user1_id`, `user2_id` - Participating users
- `topic` - Debate subject
- `log` - JSON formatted conversation history
- `winner` - Optional result (not used in current version)
- `timestamp` - Session start time

### Topics Table
- `id` (Primary Key) - Topic identifier
- `topic_text` - Debate subject statement

## Installation and Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DebatePlatform
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the server**
   ```bash
   cd backend
   python app.py
   ```

4. **Open the application**
   Navigate to `frontend/login.html` in your web browser or serve the files through a local web server.

### Alternative Setup with npm

```bash
# Install dependencies
npm run setup

# Start the server
npm start
```

## Usage Guide

### 1. Account Creation
- Navigate to the login page
- Click "Create Account"
- Enter a username (min 3 characters) and password (min 6 characters)
- Confirm your password

### 2. Login
- Enter your credentials on the login page
- Click "Login" to access the platform

### 3. Finding a Debate
- On the matchmaking page, click "Start Matchmaking"
- The system will find opponents with similar MMR ratings
- Wait times increase matchmaking range automatically

### 4. Debate Session
- **Preparation Phase**: 3 minutes to prepare arguments
- **Debate Phase**: Alternating turns with 2-minute time limits
- **Turn System**: 3 arguments per participant (6 total turns)
- Submit arguments via the text area during your turn

### 5. Session Completion
- View complete debate log and statistics
- Download conversation history as text file
- Return to lobby for another match

## WebSocket API

### Client → Server Messages

```javascript
// Authentication
{ "type": "authenticate", "username": "user", "password": "pass" }

// Account creation
{ "type": "create_account", "username": "user", "password": "pass" }

// Join matchmaking queue
{ "type": "join_matchmaking", "user_id": 123 }

// Leave matchmaking queue
{ "type": "leave_matchmaking", "user_id": 123 }

// Submit debate argument
{ "type": "debate_message", "user_id": 123, "content": "argument text" }
```

### Server → Client Messages

```javascript
// Authentication result
{ "type": "auth_response", "success": true, "user_id": 123, "mmr": 1000 }

// Match found notification
{ "type": "match_found", "debate_id": 456, "topic": "...", "opponent": {...} }

// Turn notifications
{ "type": "your_turn", "turn_number": 1, "time_limit_minutes": 2 }
{ "type": "opponent_turn", "turn_number": 1, "time_limit_minutes": 2 }

// Debate messages
{ "type": "message", "sender_id": 123, "content": "...", "timestamp": "..." }

// Timers
{ "type": "prep_timer", "remaining_seconds": 180, "display": "03:00" }
{ "type": "turn_timer", "remaining_seconds": 120, "display": "02:00" }

// Session end
{ "type": "debate_ended", "final_log": [...], "topic": "..." }
```

## Configuration

### Server Settings (backend/app.py)
- **Host**: `localhost` (default)
- **Port**: `8765` (default WebSocket port)
- **Debug Mode**: Enabled by default

### Timing Configuration
- **Preparation Time**: 3 minutes
- **Turn Time Limit**: 2 minutes
- **Maximum Turns**: 6 (3 per participant)

### Matchmaking Settings
- **Initial MMR**: 1000 points
- **Base MMR Range**: ±100 points
- **Range Expansion**: +50 points every 30 seconds
- **Maximum Range**: ±500 points

## Development

### Adding New Debate Topics
Edit `backend/database.py` and modify the `insert_default_topics()` method:

```python
default_topics = [
    "Your new debate topic here",
    # ... existing topics
]
```

### Customizing Timers
Modify timing constants in `backend/debate_logic.py`:

```python
self.prep_time_minutes = 3    # Preparation time
self.turn_time_minutes = 2    # Turn time limit
self.max_turns = 6           # Total turns
```

### Styling Modifications
All visual styling is contained in `frontend/style.css`. The design follows a minimal, functional approach with:
- Clean typography (Arial font family)
- Subtle color scheme (blues, grays, whites)
- Responsive layout for mobile devices
- Clear visual hierarchy

## Architecture Overview

### Backend Components
1. **WebSocket Manager** - Handles all real-time connections
2. **Matchmaking System** - MMR-based opponent pairing
3. **Debate Logic** - Turn management and session flow
4. **Database Layer** - User accounts and session storage

### Frontend Components
1. **Authentication Flow** - Login and account creation
2. **Matchmaking Interface** - Queue management and match display
3. **Debate Session** - Real-time argument submission
4. **Session Summary** - Results and log display

### Data Flow
1. Users authenticate via WebSocket
2. Matchmaking pairs users by MMR similarity
3. Debate sessions manage turn-based communication
4. All interactions logged to SQLite database
5. Sessions end with complete argument history

## Limitations and Future Enhancements

### Current Limitations
- No argument judging or scoring system
- Single server instance (no clustering)
- Basic MMR system (no complex ranking)
- Local file-based database

### Potential Enhancements
- Argument quality assessment
- Spectator mode for debates
- Replay system for past debates
- Advanced statistics and analytics
- Multi-server deployment support
- Enhanced mobile responsiveness

## Troubleshooting

### Common Issues

**WebSocket Connection Failed**
- Ensure Python server is running on port 8765
- Check firewall settings
- Verify WebSocket support in browser

**Database Errors**
- Ensure write permissions in database directory
- Check SQLite installation
- Verify database file creation

**Matchmaking Not Working**
- Confirm multiple users are in queue
- Check server logs for matchmaking service status
- Verify WebSocket connections are established

### Log Files
Server logs are displayed in the console. Enable debug mode in `app.py` for detailed information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Check the WebSocket connection in browser console
- Verify server is running on correct port

---

**Happy Debating! 🎯**
