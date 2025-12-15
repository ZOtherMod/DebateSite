#!/usr/bin/env python3
"""
Direct test of DebateSession timer functionality
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
        print(f"📨 Message to user {user_id}: {message.get('type')} - {message.get('display', message.get('message', ''))}")
        return True

async def test_debate_session_timers():
    """Test DebateSession timer functionality directly"""
    print("🧪 Testing DebateSession Timer Logic")
    print("=" * 40)
    
    # Initialize mock components
    database = Database('backend/database/test.db')  # Use a test database
    mock_ws = MockWebSocketManager()
    
    # Create a debate session
    session = DebateSession(
        debate_id=999,
        user1_id=1,
        user2_id=2,
        topic="Test topic: Should AI be regulated?",
        websocket_manager=mock_ws,
        database=database
    )
    
    print(f"✅ Created DebateSession:")
    print(f"   Debate ID: {session.debate_id}")
    print(f"   User 1: {session.user1_id} ({session.user1_side})")
    print(f"   User 2: {session.user2_id} ({session.user2_side})")
    print(f"   Topic: {session.topic}")
    print(f"   Prep time: {session.prep_time_minutes} minutes")
    print(f"   Turn time: {session.turn_time_minutes} minutes")
    
    # Start the debate and test timers
    print(f"\n🚀 Starting debate session...")
    
    # Start debate (this should trigger preparation timer)
    await session.start_debate()
    
    # Let the preparation timer run for a few seconds
    print(f"\n⏰ Letting preparation timer run for 10 seconds...")
    await asyncio.sleep(10)
    
    # Check messages received
    print(f"\n📊 Messages received during test:")
    timer_messages = 0
    for msg in mock_ws.messages:
        msg_type = msg['message'].get('type')
        if 'timer' in msg_type:
            timer_messages += 1
        
        # Print important messages
        if msg_type in ['debate_started', 'prep_timer_start', 'prep_timer', 'debate_phase_start']:
            user = msg['user_id']
            content = msg['message']
            display = content.get('display', content.get('message', ''))
            print(f"   User {user}: {msg_type} - {display}")
    
    print(f"\n✅ Test Summary:")
    print(f"   Total messages: {len(mock_ws.messages)}")
    print(f"   Timer messages: {timer_messages}")
    print(f"   Debate phase: {session.phase}")
    print(f"   Current turn: {session.current_turn}")
    
    # Check if timers are working
    if timer_messages > 0:
        print("✅ Timer functionality is working!")
    else:
        print("❌ No timer messages received")
    
    # Cancel any running tasks
    if session.prep_timer_task:
        session.prep_timer_task.cancel()
    if session.turn_timer_task:
        session.turn_timer_task.cancel()

if __name__ == "__main__":
    asyncio.run(test_debate_session_timers())
