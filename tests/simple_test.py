#!/usr/bin/env python3
"""
Simple timer test with debug output
"""
import asyncio
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from database import Database
from debate_logic import DebateSession

class DebugWebSocketManager:
    async def send_to_user(self, user_id, message):
        msg_type = message.get('type')
        if msg_type == 'prep_timer':
            remaining = message.get('remaining_seconds')
            display = message.get('display')
            print(f"TIMER: {display} ({remaining}s)")
        elif msg_type == 'debate_phase_start':
            print("DEBATE PHASE STARTED!")
        elif msg_type == 'your_turn':
            turn = message.get('turn_number')
            print(f"YOUR TURN: {turn}")
        return True

async def simple_timer_test():
    print("Simple Timer Test")
    print("=" * 20)
    
    database = Database('backend/database/test.db')
    ws = DebugWebSocketManager()
    
    session = DebateSession(999, 1, 2, "Test", ws, database)
    session.prep_time_minutes = 8/60  # 8 seconds
    
    print(f"Prep duration will be: {session.prep_time_minutes * 60} seconds")
    
    await session.start_debate()
    
    # Wait and see what happens
    await asyncio.sleep(12)
    
    print(f"Final phase: {session.phase}")

if __name__ == "__main__":
    asyncio.run(simple_timer_test())
