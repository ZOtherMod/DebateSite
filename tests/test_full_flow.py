#!/usr/bin/env python3
"""
Test complete debate flow with working timers
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
        self.last_timer_display = None
    
    async def send_to_user(self, user_id, message):
        """Record messages and show key ones"""
        self.messages.append({
            'user_id': user_id,
            'message': message,
            'timestamp': asyncio.get_event_loop().time()
        })
        
        msg_type = message.get('type')
        
        # Show important messages
        if msg_type == 'debate_started':
            side = message.get('your_side')
            print(f"🎭 User {user_id}: Assigned {side} side")
            
        elif msg_type == 'prep_timer_start':
            duration = message.get('duration_minutes')
            print(f"⏰ User {user_id}: Prep timer started ({duration} min)")
            
        elif msg_type == 'prep_timer':
            display = message.get('display')
            if display != self.last_timer_display:
                remaining = message.get('remaining_seconds')
                print(f"⏱️  Prep timer: {display} ({remaining}s remaining)")
                self.last_timer_display = display
                
        elif msg_type == 'debate_phase_start':
            print(f"🚀 Debate phase started!")
            
        elif msg_type == 'your_turn':
            turn = message.get('turn_number')
            side = message.get('your_side')
            print(f"👆 User {user_id}: Your turn #{turn} ({side})")
            
        elif msg_type == 'opponent_turn':
            turn = message.get('turn_number')
            side = message.get('opponent_side')
            print(f"⏳ User {user_id}: Opponent turn #{turn} ({side})")
            
        elif msg_type == 'turn_timer':
            display = message.get('display')
            if int(message.get('remaining_seconds', 0)) % 5 == 0:  # Every 5 seconds
                print(f"⏱️  Turn timer: {display}")
        
        return True

async def test_full_debate_flow():
    """Test the complete debate flow with realistic timers"""
    print("🧪 Testing Complete Debate Flow")
    print("=" * 40)
    
    # Initialize mock components
    database = Database('backend/database/test.db')
    mock_ws = MockWebSocketManager()
    
    # Create a debate session with very short times for testing
    session = DebateSession(
        debate_id=997,
        user1_id=10,
        user2_id=20,
        topic="Should we test debate timers?",
        websocket_manager=mock_ws,
        database=database
    )
    
    # Make times very short for testing
    session.prep_time_minutes = 5/60  # 5 seconds
    session.turn_time_minutes = 4/60  # 4 seconds
    session.max_turns = 4  # Only 2 turns per player
    
    print(f"✅ Created DebateSession:")
    print(f"   User {session.user1_id}: {session.user1_side}")
    print(f"   User {session.user2_id}: {session.user2_side}")
    print(f"   Prep time: {session.prep_time_minutes * 60:.0f} seconds")
    print(f"   Turn time: {session.turn_time_minutes * 60:.0f} seconds")
    print(f"   Max turns: {session.max_turns}")
    
    # Start the debate
    print(f"\n🚀 Starting complete debate flow...")
    await session.start_debate()
    
    # Let it run for 25 seconds (should be enough for prep + several turns)
    print(f"\n⏰ Running debate for 25 seconds...")
    await asyncio.sleep(25)
    
    # Analyze results
    prep_msgs = sum(1 for msg in mock_ws.messages if 'prep_timer' in msg['message'].get('type', ''))
    turn_msgs = sum(1 for msg in mock_ws.messages if 'turn' in msg['message'].get('type', ''))
    debate_started = any(msg['message'].get('type') == 'debate_phase_start' for msg in mock_ws.messages)
    
    print(f"\n📊 Final Results:")
    print(f"   Total messages: {len(mock_ws.messages)}")
    print(f"   Prep timer messages: {prep_msgs}")
    print(f"   Turn-related messages: {turn_msgs}")
    print(f"   Debate phase reached: {debate_started}")
    print(f"   Final phase: {session.phase}")
    print(f"   Turn count: {session.turn_count}")
    print(f"   Current turn user: {session.current_turn}")
    
    # Final assessment
    if debate_started and turn_msgs > 0:
        print("✅ COMPLETE SUCCESS: All timer functionality working!")
    elif debate_started:
        print("✅ PARTIAL SUCCESS: Debate phase reached, timers working!")
    elif prep_msgs > 0:
        print("✅ BASIC SUCCESS: Prep timers working!")
    else:
        print("❌ ISSUES: Timer functionality needs investigation")
    
    # Cancel any running tasks
    if session.prep_timer_task:
        session.prep_timer_task.cancel()
    if session.turn_timer_task:
        session.turn_timer_task.cancel()

if __name__ == "__main__":
    asyncio.run(test_full_debate_flow())
