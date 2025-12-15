#!/usr/bin/env python3
"""
Persistent WebSocket test for debate timer functionality
"""
import asyncio
import websockets
import json

async def simulate_user_session(user_id, username, password):
    """Simulate a persistent user session"""
    uri = "ws://localhost:8765"
    
    try:
        async with websockets.connect(uri) as websocket:
            print(f"👤 User {username} connected")
            
            # Authenticate
            auth_msg = {
                "type": "authenticate",
                "username": username,
                "password": password
            }
            
            await websocket.send(json.dumps(auth_msg))
            response = await websocket.recv()
            auth_result = json.loads(response)
            
            if not auth_result.get('success'):
                print(f"❌ {username} authentication failed")
                return None
            
            actual_user_id = auth_result.get('user_id')
            print(f"✅ {username} authenticated with ID: {actual_user_id}")
            
            # Join matchmaking
            join_msg = {
                "type": "join_matchmaking",
                "user_id": actual_user_id
            }
            
            await websocket.send(json.dumps(join_msg))
            print(f"🎯 {username} joined matchmaking queue")
            
            # Listen for messages
            message_count = 0
            timer_messages = 0
            
            async for message in websocket:
                data = json.loads(message)
                message_count += 1
                
                msg_type = data.get('type')
                print(f"📨 {username} received: {msg_type}")
                
                if msg_type == 'match_found':
                    print(f"🎉 {username} found match! Debate ID: {data.get('debate_id')}")
                    topic = data.get('topic')
                    print(f"📋 Topic: {topic}")
                    
                    # Start the debate
                    start_msg = {
                        "type": "start_debate",
                        "user_id": actual_user_id,
                        "debate_id": data.get('debate_id')
                    }
                    await websocket.send(json.dumps(start_msg))
                    
                elif msg_type == 'debate_started':
                    side = data.get('your_side')
                    print(f"🎭 {username} assigned side: {side}")
                    
                elif msg_type == 'prep_timer_start':
                    duration = data.get('duration_minutes')
                    print(f"⏰ {username}: Preparation timer started ({duration} min)")
                    
                elif msg_type == 'prep_timer':
                    timer_messages += 1
                    if timer_messages % 5 == 0:  # Print every 5th update
                        display = data.get('display')
                        remaining = data.get('remaining_seconds')
                        print(f"⏱️  {username}: {display} ({remaining}s remaining)")
                        
                elif msg_type == 'debate_phase_start':
                    print(f"🚀 {username}: Debate phase started!")
                    
                elif msg_type == 'your_turn':
                    turn_num = data.get('turn_number')
                    side = data.get('your_side')
                    print(f"👆 {username}: Your turn #{turn_num} ({side})")
                    
                    # Submit an argument
                    arg_msg = {
                        "type": "debate_message",
                        "user_id": actual_user_id,
                        "content": f"This is {username}'s argument for turn {turn_num}"
                    }
                    await websocket.send(json.dumps(arg_msg))
                    
                elif msg_type == 'opponent_turn':
                    turn_num = data.get('turn_number')
                    opponent_side = data.get('opponent_side')
                    print(f"⏳ {username}: Opponent's turn #{turn_num} ({opponent_side})")
                    
                elif msg_type == 'turn_timer':
                    if timer_messages % 10 == 0:  # Print occasionally
                        display = data.get('display')
                        print(f"⏱️  {username}: Turn timer {display}")
                    
                elif msg_type == 'message':
                    sender = data.get('sender_username')
                    content = data.get('content')
                    print(f"💬 {username} heard: {sender}: {content}")
                    
                # Stop after receiving many messages or timeout
                if message_count > 50:
                    print(f"🔄 {username}: Received enough messages ({message_count})")
                    break
                    
            return {
                'user': username,
                'messages_received': message_count,
                'timer_messages': timer_messages
            }
            
    except Exception as e:
        print(f"❌ {username} session failed: {e}")
        return None

async def test_dual_user_debate():
    """Test with two persistent user sessions"""
    print("🧪 Testing Dual User Debate with Timers")
    print("=" * 50)
    
    # Run both user sessions concurrently
    results = await asyncio.gather(
        simulate_user_session(1, "testuser1", "password123"),
        simulate_user_session(2, "testuser2", "password123"),
        return_exceptions=True
    )
    
    print("\n📊 Test Results:")
    for result in results:
        if isinstance(result, dict):
            user = result['user']
            msg_count = result['messages_received']
            timer_count = result['timer_messages']
            print(f"   {user}: {msg_count} messages, {timer_count} timer updates")
        else:
            print(f"   Error: {result}")

if __name__ == "__main__":
    asyncio.run(test_dual_user_debate())
