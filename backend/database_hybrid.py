import os
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import hashlib

class Database:
    def __init__(self):
        # Check if we're in production with PostgreSQL
        self.database_url = os.getenv('DATABASE_URL')
        
        if self.database_url and self.database_url.startswith('postgres'):
            self.use_postgres = True
            print("Using PostgreSQL database")
        else:
            
            self.use_postgres = False
            self.db_path = 'database/app.db'
            print("Using SQLite database (local development)")
            
        self.init_database()
    
    def get_connection(self):
        if self.use_postgres:
            return psycopg2.connect(self.database_url, cursor_factory=RealDictCursor)
        else:
            # Ensure database directory exists for SQLite
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            return sqlite3.connect(self.db_path)
    
    def init_database(self):
        """Initialize the database with required tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if self.use_postgres:
            # PostgreSQL table creation
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    mmr INTEGER DEFAULT 1000
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS debates (
                    id SERIAL PRIMARY KEY,
                    user1_id INTEGER REFERENCES users(id),
                    user2_id INTEGER REFERENCES users(id),
                    topic_id INTEGER REFERENCES topics(id),
                    status VARCHAR(50) DEFAULT 'active',
                    current_turn INTEGER DEFAULT 1,
                    turn_count INTEGER DEFAULT 0,
                    max_turns INTEGER DEFAULT 6,
                    winner_id INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS topics (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(500) NOT NULL,
                    description TEXT
                )
            ''')
            
        else:
            # SQLite table creation (existing code)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    mmr INTEGER DEFAULT 1000
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS debates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user1_id INTEGER,
                    user2_id INTEGER,
                    topic_id INTEGER,
                    status TEXT DEFAULT 'active',
                    current_turn INTEGER DEFAULT 1,
                    turn_count INTEGER DEFAULT 0,
                    max_turns INTEGER DEFAULT 6,
                    winner_id INTEGER,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user1_id) REFERENCES users (id),
                    FOREIGN KEY (user2_id) REFERENCES users (id),
                    FOREIGN KEY (topic_id) REFERENCES topics (id)
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS topics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT
                )
            ''')
        
        # Add sample topics if none exist
        if self.use_postgres:
            cursor.execute("SELECT COUNT(*) FROM topics")
            count = cursor.fetchone()[0]
        else:
            cursor.execute("SELECT COUNT(*) FROM topics")
            count = cursor.fetchone()[0]
            
        if count == 0:
            sample_topics = [
                ("Should artificial intelligence be regulated?", "Debate the need for AI regulation and oversight."),
                ("Is remote work better than office work?", "Compare the benefits and drawbacks of remote vs office work."),
                ("Should social media be age-restricted?", "Discuss whether social media platforms should have age restrictions.")
            ]
            
            for title, description in sample_topics:
                if self.use_postgres:
                    cursor.execute("INSERT INTO topics (title, description) VALUES (%s, %s)", (title, description))
                else:
                    cursor.execute("INSERT INTO topics (title, description) VALUES (?, ?)", (title, description))
        
        conn.commit()
        conn.close()
        
    # Rest of your existing methods would need similar PostgreSQL/SQLite branching...
