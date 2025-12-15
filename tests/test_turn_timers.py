#!/usr/bin/env python3
"""
Test turn timer functionality
"""
import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from database import Database
from debate_logic import DebateSession

class MockWebSocketManager:
    """Mock WebSocket manager for testing"""
    
    def __init__(self):
        self.messages = []
    
    async def send_to_user(self, user_id, message):
        """Record messages instead of sending them"""
        self.messages.append({
            'user_id': user_id,
            'message': message,
            'timestamp': asyncio.get_event_loop().time()
        })
        msg_type = message.get('type')
        if msg_type in ['your_turn', 'opponent_turn', 'turn_timer']:
            display = message.get('display', '')
            side = message.get('your_side', message.get('opponent_side', ''))
            turn = message.get('turn_number', '')
            print(f"📨 User {user_id}: {msg_type} - Turn {turn} {side} {display}")
        return True

async def test_turn_timers():
    """Test turn timer functionality"""
    print("🧪 Testing Turn Timer Logic")
    print("=" * 40)
    
    # Initialize mock components
    database = Database('backend/database/test.db')
    mock_ws = MockWebSocketManager()
    
    # Create a debate session with shorter times for testing
    session = DebateSession(
        debate_id=998,
        user1_id=1,
        user2_id=2,
        topic="Test turn timers",
        websocket_manager=mock_ws,
        database=database
    )
    
    # Shorten times for testing
    session.prep_time_minutes = 0.1  # 6 seconds
    session.turn_time_minutes = 0.1  # 6 seconds
    
    print(f"✅ Created DebateSession with fast timers:")
    print(f"   Prep time: {session.prep_time_minutes * 60} seconds")
    print(f"   Turn time: {session.turn_time_minutes * 60} seconds")
    
    # Start the debate
    print(f"\n🚀 Starting debate with fast timers...")
    await session.start_debate()
    
    # Let it run through prep phase and into debate phase
    print(f"\n⏰ Waiting for prep phase to complete and turns to start...")
    await asyncio.sleep(15)  # Wait 15 seconds to see multiple phases
    
    # Check what happened
    prep_messages = 0
    turn_messages = 0
    debate_phase_started = False
    
    for msg in mock_ws.messages:
        msg_type = msg['message'].get('type')
        if 'prep_timer' in msg_type:
            prep_messages += 1
        elif 'turn' in msg_type:
            turn_messages += 1
        elif msg_type == 'debate_phase_start':
            debate_phase_started = True
            print(f"🚀 Debate phase started!")
    
    print(f"\n✅ Turn Timer Test Summary:")
    print(f"   Total messages: {len(mock_ws.messages)}")
    print(f"   Prep timer messages: {prep_messages}")
    print(f"   Turn messages: {turn_messages}")
    print(f"   Debate phase started: {debate_phase_started}")
    print(f"   Final phase: {session.phase}")
    print(f"   Turn count: {session.turn_count}")
    
    # Cancel any running tasks
    if session.prep_timer_task:
        session.prep_timer_task.cancel()
    if session.turn_timer_task:
        session.turn_timer_task.cancel()

if __name__ == "__main__":
    asyncio.run(test_turn_timers())
