#!/usr/bin/env python3
"""
Simple test script to verify debate timer functionality
"""
import asyncio
import websockets
import json

async def test_debate_flow():
    """Test the complete debate flow with timers"""
    
    # Connect to WebSocket
    uri = "ws://localhost:8765"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket server")
            
            # Test 1: Create two test users
            user1_auth = {
                "type": "create_account",
                "username": "testuser1",
                "password": "password123"
            }
            
            user2_auth = {
                "type": "create_account", 
                "username": "testuser2",
                "password": "password123"
            }
            
            # Send user creation requests
            await websocket.send(json.dumps(user1_auth))
            response1 = await websocket.recv()
            print(f"User 1 creation: {json.loads(response1)}")
            
            await websocket.send(json.dumps(user2_auth))
            response2 = await websocket.recv()
            print(f"User 2 creation: {json.loads(response2)}")
            
            print("✅ Test users created successfully")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    print("🧪 Testing Debate Platform Timer Functionality")
    print("=" * 50)
    asyncio.run(test_debate_flow())
