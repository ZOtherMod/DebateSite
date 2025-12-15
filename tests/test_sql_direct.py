#!/usr/bin/env python3

import sys
import os
import sqlite3
import hashlib

def test_direct_sql():
    """Test SQL directly to isolate the issue"""
    print("Testing direct SQL operations...")
    
    # Create in-memory database
    conn = sqlite3.connect(':memory:')
    cursor = conn.cursor()
    
    # Create users table with user_class
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            mmr INTEGER DEFAULT 1000,
            user_class INTEGER DEFAULT 0
        )
    ''')
    
    # Insert test account
    password_hash = hashlib.sha256('passpass'.encode()).hexdigest()
    cursor.execute("INSERT INTO users (username, password_hash, user_class, mmr) VALUES (?, ?, ?, ?)", 
                 ('test', password_hash, 2, 1500))
    
    # Test authentication query
    cursor.execute("SELECT id, mmr, user_class FROM users WHERE username = ? AND password_hash = ?", 
                 ('test', password_hash))
    
    result = cursor.fetchone()
    print(f"Direct SQL result: {result}")
    
    if result:
        user_info = {'id': result[0], 'username': 'test', 'mmr': result[1], 'user_class': result[2]}
        print(f"User info: {user_info}")
        return True
    return False

if __name__ == "__main__":
    test_direct_sql()
