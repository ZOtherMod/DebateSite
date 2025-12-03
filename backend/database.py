import sqlite3
import hashlib
from datetime import datetime
import os

class Database:
    def __init__(self, db_path='database/app.db'):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        return sqlite3.connect(self.db_path)
    
    def init_database(self):
        """Initialize the database with required tables"""
        # Ensure database directory exists
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                mmr INTEGER DEFAULT 1000
            )
        ''')
        
        # Create debates table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS debates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user1_id INTEGER NOT NULL,
                user2_id INTEGER NOT NULL,
                topic TEXT NOT NULL,
                log TEXT NOT NULL,
                winner INTEGER,
                timestamp DATETIME NOT NULL,
                FOREIGN KEY (user1_id) REFERENCES users (id),
                FOREIGN KEY (user2_id) REFERENCES users (id),
                FOREIGN KEY (winner) REFERENCES users (id)
            )
        ''')
        
        # Create topics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS topics (
                id INTEGER PRIMARY KEY,
                topic_text TEXT NOT NULL
            )
        ''')
        
        conn.commit()
        
        # Insert default topics if table is empty
        cursor.execute('SELECT COUNT(*) FROM topics')
        if cursor.fetchone()[0] == 0:
            self.insert_default_topics(cursor)
            conn.commit()
        
        conn.close()
    
    def insert_default_topics(self, cursor):
        """Insert default debate topics"""
        default_topics = [
            "Social media has a positive impact on society",
            "Remote work is better than office work",
            "Artificial intelligence will benefit humanity more than it will harm it",
            "Video games have a positive impact on children",
            "Climate change is the most pressing issue of our time",
            "Free speech should have no limitations",
            "Technology makes us more isolated",
            "Education should be free for everyone",
            "Space exploration is worth the investment",
            "Democracy is the best form of government"
        ]
        
        for i, topic in enumerate(default_topics, 1):
            cursor.execute('INSERT INTO topics (id, topic_text) VALUES (?, ?)', (i, topic))
    
    def hash_password(self, password):
        """Hash a password using SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def create_user(self, username, password):
        """Create a new user account"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            password_hash = self.hash_password(password)
            cursor.execute(
                'INSERT INTO users (username, password_hash) VALUES (?, ?)',
                (username, password_hash)
            )
            conn.commit()
            user_id = cursor.lastrowid
            conn.close()
            return {'success': True, 'user_id': user_id}
        except sqlite3.IntegrityError:
            conn.close()
            return {'success': False, 'error': 'Username already exists'}
    
    def authenticate_user(self, username, password):
        """Authenticate a user login"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        password_hash = self.hash_password(password)
        cursor.execute(
            'SELECT id, mmr FROM users WHERE username = ? AND password_hash = ?',
            (username, password_hash)
        )
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {'success': True, 'user_id': result[0], 'mmr': result[1]}
        else:
            return {'success': False, 'error': 'Invalid credentials'}
    
    def get_user_by_id(self, user_id):
        """Get user information by ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, username, mmr FROM users WHERE id = ?', (user_id,))
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {'id': result[0], 'username': result[1], 'mmr': result[2]}
        return None
    
    def get_random_topic(self):
        """Get a random debate topic"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT topic_text FROM topics ORDER BY RANDOM() LIMIT 1')
        result = cursor.fetchone()
        conn.close()
        
        return result[0] if result else "Should pineapple be on pizza?"
    
    def create_debate(self, user1_id, user2_id, topic):
        """Create a new debate session"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO debates (user1_id, user2_id, topic, log, timestamp)
            VALUES (?, ?, ?, ?, ?)
        ''', (user1_id, user2_id, topic, '[]', datetime.now()))
        
        debate_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return debate_id
    
    def update_debate_log(self, debate_id, log_data):
        """Update the debate log"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('UPDATE debates SET log = ? WHERE id = ?', (log_data, debate_id))
        conn.commit()
        conn.close()
    
    def get_debate(self, debate_id):
        """Get debate information"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, user1_id, user2_id, topic, log, winner, timestamp
            FROM debates WHERE id = ?
        ''', (debate_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                'id': result[0],
                'user1_id': result[1],
                'user2_id': result[2],
                'topic': result[3],
                'log': result[4],
                'winner': result[5],
                'timestamp': result[6]
            }
        return None
