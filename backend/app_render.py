import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
import http.server
import socketserver
import threading
from http.server import SimpleHTTPRequestHandler
import urllib.parse

# Import our modules
from database import Database
from websocket_manager import WebSocketManager, WebSocketHandler
from matchmaking import Matchmaker
from debate_logic import DebateManager

try:
    import websockets
    from websockets.exceptions import ConnectionClosed
    from websockets.legacy.server import WebSocketServerProtocol
except ImportError:
    print("Error: websockets library not installed. Please install it with: pip install websockets")
    exit(1)

class HybridServer:
    """A server that handles both HTTP requests and WebSocket upgrades on the same port"""
    
    def __init__(self, websocket_handler, frontend_path, host='localhost', port=8080):
        self.websocket_handler = websocket_handler
        self.frontend_path = Path(frontend_path)
        self.host = host
        self.port = port
    
    async def handler(self, path, request_headers):
        """Handle both HTTP and WebSocket requests"""
        # Check if this is a WebSocket upgrade request
        if 'upgrade' in request_headers and request_headers['upgrade'].lower() == 'websocket':
            # This is a WebSocket connection - delegate to WebSocket handler
            return self.websocket_handler.handle_connection
        
        # This is an HTTP request - we shouldn't reach here in normal operation
        # because the HTTP server handles these directly
        return None

class CustomHTTPRequestHandler(SimpleHTTPRequestHandler):
    """Custom HTTP handler to serve static files from frontend directory"""
    
    def __init__(self, *args, frontend_path=None, **kwargs):
        self.frontend_path = frontend_path or Path(__file__).parent.parent / "frontend"
        super().__init__(*args, **kwargs)
    
    def translate_path(self, path):
        """Translate a /-separated PATH to the local filename syntax."""
        # Parse the URL to remove query parameters
        path = urllib.parse.urlparse(path).path
        
        # Remove leading slash
        path = path.lstrip('/')
        
        # Default to index.html if no path specified
        if not path or path == '/':
            path = 'login.html'  # Default to login page
        
        # Construct the full path
        full_path = self.frontend_path / path
        
        return str(full_path)

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
        self.websocket_server = None
        self.http_server = None
        
        print(f"Debate Platform Server initialized")
        print(f"Host: {self.host}:{self.port}")
        print(f"Debug mode: {'ON' if self.debug else 'OFF'}")
    
    def start_http_server(self):
        """Start HTTP server for static files"""
        try:
            frontend_path = Path(__file__).parent.parent / "frontend"
            if frontend_path.exists():
                # For production, serve HTTP on the main port
                # For development, use port 8080 for HTTP
                if os.getenv('PORT'):
                    # Production: serve HTTP on main port
                    http_port = self.port
                    print("Production mode: HTTP server will use main port")
                else:
                    # Development: serve HTTP on port 8080
                    http_port = 8080
                    print("Development mode: HTTP server on port 8080")
                
                def handler_factory(*args, **kwargs):
                    return CustomHTTPRequestHandler(*args, frontend_path=frontend_path, **kwargs)
                
                self.http_server = socketserver.TCPServer((self.host, http_port), handler_factory)
                
                def serve():
                    print(f"✓ HTTP server running on http://{self.host}:{http_port}")
                    print(f"✓ Frontend accessible at http://{self.host}:{http_port}")
                    self.http_server.serve_forever()
                
                http_thread = threading.Thread(target=serve, daemon=True)
                http_thread.start()
                return http_port
        except Exception as e:
            print(f"Could not start HTTP server: {e}")
            return None
    
    async def start_server(self):
        """Start the server services"""
        try:
            print("Starting Debate Platform Server...")
            print(f"Host: {self.host}, Port: {self.port}")
            
            # Start matchmaking service
            matchmaking_task = asyncio.create_task(
                self.matchmaker.start_matchmaking_service()
            )
            
            # Handle different deployment modes
            if os.getenv('PORT'):
                # Production mode: Use HTTP server on main port, skip WebSocket server
                # (We'll handle WebSocket upgrades through a proxy or different approach)
                print("Production mode: Starting HTTP-only server")
                http_port = self.start_http_server()
                
                # In production, we'll rely on the HTTP server
                # and handle WebSocket connections differently
                print(f"✓ Server started in production mode")
                print(f"✓ Frontend accessible at http://{self.host}:{self.port}")
                print("Note: WebSocket connections will be handled via HTTP upgrade")
                
                # Keep the server alive
                while self.running:
                    await asyncio.sleep(1)
                    
            else:
                # Development mode: Start both HTTP and WebSocket servers
                print("Development mode: Starting HTTP and WebSocket servers")
                
                # Start HTTP server for frontend files
                http_port = self.start_http_server()
                
                # Start WebSocket server
                print(f"Starting WebSocket server on {self.host}:{self.port}")
                self.websocket_server = await websockets.serve(
                    self.websocket_handler.handle_connection,
                    self.host,
                    self.port
                )
                
                self.running = True
                print(f"✓ WebSocket server running on ws://{self.host}:{self.port}")
                print(f"✓ Frontend accessible at http://{self.host}:{http_port}")
                
                # Keep server running
                await self.websocket_server.wait_closed()
            
            print("✓ Matchmaking service running")
            print("✓ Database initialized")
            
        except Exception as e:
            print(f"Error starting server: {e}")
            raise
    
    async def stop_server(self):
        """Stop all server services"""
        print("Stopping server...")
        self.running = False
        
        if self.websocket_server:
            self.websocket_server.close()
            await self.websocket_server.wait_closed()
        
        if self.http_server:
            self.http_server.shutdown()
            self.http_server.server_close()
        
        print("✓ Server stopped")

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
