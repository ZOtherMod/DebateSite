#!/usr/bin/env python3

import asyncio
import json
import websockets

async def test_user_class():
    """Test UserClass functionality via WebSocket"""
    print("Testing UserClass functionality via WebSocket...")
    
    uri = "ws://localhost:8765"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket server")
            
            # Test 1: Login as test account
            print("\n1. Testing test account login...")
            auth_message = {
                "type": "authenticate",
                "username": "test",
                "password": "passpass"
            }
            
            await websocket.send(json.dumps(auth_message))
            response = await websocket.recv()
            data = json.loads(response)
            
            print(f"Response: {data}")
            
            if data.get('success') and data.get('user_class') == 2:
                print("✅ Test account login successful with UserClass 2")
            else:
                print(f"❌ Test account login failed or wrong UserClass: {data}")
            
            # Test 2: Create regular account
            print("\n2. Testing regular account creation...")
            import random
            username = f"user{random.randint(1000, 9999)}"
            
            create_message = {
                "type": "create_account",
                "username": username,
                "password": "password123"
            }
            
            await websocket.send(json.dumps(create_message))
            response = await websocket.recv()
            data = json.loads(response)
            
            print(f"Creation response: {data}")
            
            if data.get('success'):
                print(f"✅ Regular account '{username}' created successfully")
                
                # Test 3: Login with the newly created account
                print(f"\n3. Testing login with newly created account '{username}'...")
                auth_message = {
                    "type": "authenticate",
                    "username": username,
                    "password": "password123"
                }
                
                await websocket.send(json.dumps(auth_message))
                response = await websocket.recv()
                data = json.loads(response)
                
                print(f"Login response: {data}")
                
                if data.get('success') and data.get('user_class') == 0:
                    print("✅ Regular account login successful with UserClass 0")
                else:
                    print(f"❌ Regular account login failed or wrong UserClass: {data}")
            else:
                print(f"❌ Failed to create regular account: {data}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_user_class())
