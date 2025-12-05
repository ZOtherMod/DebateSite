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
    from websockets import serve
    from websockets.exceptions import ConnectionClosed
    from websockets.http11 import Response
except ImportError as e:
    print(f"Error: websockets library not properly installed: {e}")
    print("Please install it with: pip install websockets")
    exit(1)

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
        self.server = None
        self.http_server = None
        
        print(f"Debate Platform Server initialized")
        print(f"Host: {self.host}:{self.port}")
        print(f"Debug mode: {'ON' if self.debug else 'OFF'}")
    
    def start_http_server(self):
        """Start HTTP server for static files"""
        try:
            frontend_path = Path(__file__).parent.parent / "frontend"
            if frontend_path.exists():
                # Determine HTTP port based on environment
                if os.getenv('PORT'):
                    # Production: Use the main port for HTTP
                    http_port = self.port
                else:
                    # Local development: Use different port for HTTP server
                    http_port = 8080
                
                def handler_factory(*args, **kwargs):
                    return CustomHTTPRequestHandler(*args, frontend_path=frontend_path, **kwargs)
                
                # Use ThreadingTCPServer for better concurrency in production
                if os.getenv('PORT'):
                    self.http_server = socketserver.ThreadingTCPServer((self.host, http_port), handler_factory)
                    # Allow reuse of address for production
                    self.http_server.allow_reuse_address = True
                else:
                    self.http_server = socketserver.TCPServer((self.host, http_port), handler_factory)
                
                def serve():
                    print(f"✓ HTTP server running on http://{self.host}:{http_port}")
                    print(f"✓ Frontend accessible at http://{self.host}:{http_port}")
                    try:
                        self.http_server.serve_forever()
                    except Exception as e:
                        print(f"HTTP server error: {e}")
                
                # In production, don't use daemon threads
                daemon = not bool(os.getenv('PORT'))
                http_thread = threading.Thread(target=serve, daemon=daemon)
                http_thread.start()
                return http_port
        except Exception as e:
            print(f"Could not start HTTP server: {e}")
            return None
    
    async def process_request(self, path, request_headers):
        """Handle HTTP requests that come to the WebSocket server"""
        # If this is a WebSocket upgrade request, let WebSocket handle it
        if "upgrade" in request_headers and request_headers["upgrade"].lower() == "websocket":
            return None  # Let WebSocket server handle this
            
        # Handle HTTP requests for static files
        try:
            frontend_path = Path(__file__).parent.parent / "frontend"
            
            # Default to login.html if accessing root
            if path == "/" or path == "":
                file_path = frontend_path / "login.html"
            else:
                # Remove leading slash and construct file path
                clean_path = path.lstrip("/")
                file_path = frontend_path / clean_path
            
            # Security check - ensure file is within frontend directory
            try:
                file_path.resolve().relative_to(frontend_path.resolve())
            except ValueError:
                # Path is outside frontend directory
                return Response(404, [], b"Not Found")
            
            if file_path.exists() and file_path.is_file():
                # Determine content type
                content_type = "text/html"
                if file_path.suffix == ".css":
                    content_type = "text/css"
                elif file_path.suffix == ".js":
                    content_type = "application/javascript"
                elif file_path.suffix == ".json":
                    content_type = "application/json"
                
                # Read and return file
                with open(file_path, 'rb') as f:
                    content = f.read()
                
                headers = [("Content-Type", content_type)]
                return Response(200, headers, content)
            else:
                return Response(404, [], b"Not Found")
                
        except Exception as e:
            print(f"Error serving file {path}: {e}")
            return Response(500, [], b"Internal Server Error")

    async def start_server(self):
        """Start the server services"""
        try:
            print("Starting Debate Platform Server...")
            print(f"Host: {self.host}, Port: {self.port}")
            
            # Start matchmaking service
            matchmaking_task = asyncio.create_task(
                self.matchmaker.start_matchmaking_service()
            )
            
            if os.getenv('PORT'):
                # Production mode (Render): Use WebSocket server with HTTP support
                print("Production mode: WebSocket server with HTTP support for Render")
                
                # Start WebSocket server that also handles HTTP requests
                print(f"Starting combined server on {self.host}:{self.port}")
                self.server = await websockets.serve(
                    self.websocket_handler.handle_connection,
                    self.host,
                    self.port,
                    process_request=self.process_request
                )
                
                self.running = True
                print(f"✓ Combined HTTP/WebSocket server running on {self.host}:{self.port}")
                print(f"✓ Frontend accessible at http://{self.host}:{self.port}")
                print(f"✓ WebSocket accessible at ws://{self.host}:{self.port}")
                print("✓ Matchmaking service running")
                print("✓ Database initialized")
                
                # Keep server running
                await self.server.wait_closed()
                    
            else:
                # Development mode: Separate HTTP and WebSocket servers
                print("Development mode: Separate HTTP and WebSocket servers")
                
                # Start HTTP server for frontend files
                http_port = self.start_http_server()
                
                # Start WebSocket server
                print(f"Starting WebSocket server on {self.host}:{self.port}")
                self.server = await websockets.serve(
                    self.websocket_handler.handle_connection,
                    self.host,
                    self.port
                )
                
                self.running = True
                print(f"✓ WebSocket server running on ws://{self.host}:{self.port}")
                print(f"✓ Frontend accessible at http://{self.host}:{http_port}")
                print("✓ Matchmaking service running")
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
