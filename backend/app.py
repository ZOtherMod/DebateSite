import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
import http.server
import socketserver
import threading

# Import our modules
from database import Database
from websocket_manager import WebSocketManager, WebSocketHandler
from matchmaking import Matchmaker
from debate_logic import DebateManager

try:
    import websockets
    from websockets.exceptions import ConnectionClosed
except ImportError:
    print("Error: websockets library not installed. Please install it with: pip install websockets")
    exit(1)

class DebatePlatformServer:
    def __init__(self, host=None, port=None, debug=False):
        # Use environment variables for deployment with proper defaults
        self.host = host if host is not None else os.getenv('HOST', 'localhost')
        
        # Handle port configuration properly for Render
        if port is not None:
            self.port = int(port)
        elif os.getenv('PORT'):
            self.port = int(os.getenv('PORT'))
        else:
            self.port = 8765  # Default for local development
            
        # For production deployment, use 0.0.0.0 if PORT env var is set (indicates cloud deployment)
        if os.getenv('PORT') and self.host == 'localhost':
            self.host = '0.0.0.0'
            
        self.debug = debug if debug is not None else os.getenv('DEBUG', 'False').lower() == 'true'
        
        # Initialize components
        self.database = Database()
        self.websocket_manager = WebSocketManager()
        self.debate_manager = DebateManager(self.websocket_manager, self.database)
        self.matchmaker = Matchmaker(self.websocket_manager, self.database)
        self.websocket_handler = WebSocketHandler(
            self.websocket_manager, self.matchmaker, self.debate_manager, self.database
        )
        
        # Server state
        self.running = False
        self.server = None
        self.http_server = None
        
        print(f"Debate Platform Server initialized")
        print(f"Host: {self.host}:{self.port}")
        print(f"Debug mode: {'ON' if self.debug else 'OFF'}")
    
    def start_static_server(self):
        """Start HTTP server for static files"""
        try:
            frontend_path = Path(__file__).parent.parent / "frontend"
            if frontend_path.exists():
                # Use a different port for static files, ensuring it's valid
                static_port = self.port + 1000  # Use a much higher port to avoid conflicts
                os.chdir(frontend_path)
                handler = http.server.SimpleHTTPRequestHandler
                self.http_server = socketserver.TCPServer(("", static_port), handler)
                
                def serve():
                    print(f"✓ Static file server running on port {static_port}")
                    self.http_server.serve_forever()
                
                static_thread = threading.Thread(target=serve, daemon=True)
                static_thread.start()
        except Exception as e:
            print(f"Could not start static file server: {e}")
    
    async def start_server(self):
        """Start the WebSocket server and all background services"""
        try:
            print("Starting Debate Platform Server...")
            print(f"Host: {self.host}, Port: {self.port}")
            
            # Skip static server for now - Render will handle static files differently
            # if not self.debug:
            #     self.start_static_server()
            
            # Start matchmaking service
            matchmaking_task = asyncio.create_task(
                self.matchmaker.start_matchmaking_service()
            )
            
            # Create match handler
            async def match_handler(debate_id, user1_id, user2_id, topic):
                await self.debate_manager.create_debate_session(
                    debate_id, user1_id, user2_id, topic
                )
            
            # Start WebSocket server with proper error handling
            print(f"Starting WebSocket server on {self.host}:{self.port}")
            self.server = await websockets.serve(
                self.websocket_handler.handle_connection,
                self.host,
                self.port
            )
            
            self.running = True
            print(f"✓ Server started successfully on ws://{self.host}:{self.port}")
            print("✓ Matchmaking service running")
            print("✓ WebSocket handler ready")
            print("✓ Database initialized")
            
            # Keep server running
            await self.server.wait_closed()
            
        except Exception as e:
            print(f"Error starting server: {e}")
            raise
    
    async def stop_server(self):
        """Stop the server and cleanup"""
        print("Stopping server...")
        
        self.running = False
        
        # Stop matchmaking service
        self.matchmaker.stop_matchmaking_service()
        
        # Close WebSocket server
        if self.server:
            self.server.close()
            await self.server.wait_closed()
        
        print("Server stopped")
    
    def get_status(self):
        """Get server status information"""
        return {
            'running': self.running,
            'host': self.host,
            'port': self.port,
            'connected_users': self.websocket_manager.get_connection_count(),
            'active_debates': self.debate_manager.get_active_debates_count(),
            'queue_status': self.matchmaker.queue.get_queue_status()
        }

async def main():
    """Main server entry point"""
    # Use environment variables for production deployment
    server = DebatePlatformServer()
    
    try:
        await server.start_server()
    except KeyboardInterrupt:
        print("\nReceived interrupt signal")
        await server.stop_server()
    except Exception as e:
        print(f"Server error: {e}")
        await server.stop_server()

if __name__ == "__main__":
    print("=" * 50)
    print("Online Debate Platform Server")
    print("=" * 50)
    
    # Check if database directory exists
    db_dir = Path("database")
    if not db_dir.exists():
        db_dir.mkdir(parents=True, exist_ok=True)
        print("✓ Database directory created")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutdown complete")
    except Exception as e:
        print(f"Fatal error: {e}")
        exit(1)
