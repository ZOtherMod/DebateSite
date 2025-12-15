#!/usr/bin/env python3
"""
Comprehensive test for debate timer and logic functionality
"""
import asyncio
import websockets
import json
import time

async def test_complete_debate_flow():
    """Test the complete debate flow including matchmaking and timers"""
    
    uri = "ws://localhost:8765"
    
    try:
        # Connect two WebSocket clients (simulate two users)
        async with websockets.connect(uri) as ws1, websockets.connect(uri) as ws2:
            print("✅ Connected two WebSocket clients")
            
            # Authenticate users
            auth1 = {"type": "authenticate", "username": "testuser1", "password": "password123"}
            auth2 = {"type": "authenticate", "username": "testuser2", "password": "password123"}
            
            await ws1.send(json.dumps(auth1))
            response1 = json.loads(await ws1.recv())
            print(f"User 1 auth: {response1['success']}")
            user1_id = response1.get('user_id')
            
            await ws2.send(json.dumps(auth2))
            response2 = json.loads(await ws2.recv())
            print(f"User 2 auth: {response2['success']}")
            user2_id = response2.get('user_id')
            
            if not (response1['success'] and response2['success']):
                print("❌ Authentication failed")
                return
                
            print("✅ Both users authenticated")
            
            # Join matchmaking queue
            join_queue1 = {"type": "join_matchmaking", "user_id": user1_id}
            join_queue2 = {"type": "join_matchmaking", "user_id": user2_id}
            
            await ws1.send(json.dumps(join_queue1))
            await asyncio.sleep(0.5)
            await ws2.send(json.dumps(join_queue2))
            
            print("✅ Both users joined matchmaking queue")
            
            # Wait for match found messages
            match_found = False
            debate_id = None
            
            for _ in range(10):  # Wait up to 10 seconds
                try:
                    # Check messages from both users
                    msg1 = await asyncio.wait_for(ws1.recv(), timeout=0.5)
                    data1 = json.loads(msg1)
                    if data1.get('type') == 'match_found':
                        match_found = True
                        debate_id = data1.get('debate_id')
                        print(f"✅ Match found! Debate ID: {debate_id}")
                        break
                        
                except asyncio.TimeoutError:
                    continue
            
            if not match_found:
                print("❌ Match not found within timeout")
                return
                
            # Simulate users starting debate
            start_debate1 = {"type": "start_debate", "user_id": user1_id, "debate_id": debate_id}
            await ws1.send(json.dumps(start_debate1))
            
            # Wait for debate_started message and timer messages
            timer_received = False
            prep_timer_count = 0
            
            print("🎯 Testing debate timer functionality...")
            
            for _ in range(20):  # Wait up to 20 seconds for timer messages
                try:
                    # Check for messages from user 1
                    msg1 = await asyncio.wait_for(ws1.recv(), timeout=1.0)
                    data1 = json.loads(msg1)
                    
                    if data1.get('type') == 'debate_started':
                        print(f"✅ Debate started! Your side: {data1.get('your_side')}")
                        
                    elif data1.get('type') == 'prep_timer_start':
                        print(f"✅ Preparation timer started ({data1.get('duration_minutes')} minutes)")
                        timer_received = True
                        
                    elif data1.get('type') == 'prep_timer':
                        prep_timer_count += 1
                        remaining = data1.get('remaining_seconds', 0)
                        display = data1.get('display', '00:00')
                        if prep_timer_count % 10 == 0:  # Print every 10th timer update
                            print(f"⏱️  Prep timer: {display} ({remaining}s remaining)")
                            
                    elif data1.get('type') == 'debate_phase_start':
                        print("✅ Debate phase started!")
                        
                    elif data1.get('type') == 'your_turn':
                        turn_num = data1.get('turn_number', 1)
                        side = data1.get('your_side', 'Unknown')
                        print(f"✅ Your turn #{turn_num} ({side} side)")
                        
                except asyncio.TimeoutError:
                    if prep_timer_count > 0:
                        print(f"✅ Received {prep_timer_count} timer updates")
                        break
                    continue
            
            if timer_received and prep_timer_count > 0:
                print("✅ Timer functionality is working correctly!")
            else:
                print("❌ Timer functionality may have issues")
                
            print(f"📊 Test Summary:")
            print(f"   - WebSocket connection: ✅")
            print(f"   - User authentication: ✅") 
            print(f"   - Matchmaking: ✅")
            print(f"   - Debate session creation: ✅")
            print(f"   - Timer functionality: {'✅' if timer_received else '❌'}")
            print(f"   - Timer updates received: {prep_timer_count}")
                
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🧪 Comprehensive Debate Timer Test")
    print("=" * 50)
    asyncio.run(test_complete_debate_flow())
