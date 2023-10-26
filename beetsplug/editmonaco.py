import http.server
import signal
import socketserver
import threading
import webbrowser

from beets.plugins import BeetsPlugin
from beets.ui import Subcommand


class EditMonacoPlugin(BeetsPlugin):
    port = 8888
    http_server = None
    server_stopped = threading.Event()  # Event to signal server stop

    def commands(self):
        command = Subcommand("editmonaco", help="do something super")
        command.func = self.test_command
        return [command]

    def test_command(self, lib, opts, args):
        # Start the HTTP server in a separate thread
        http_server_thread = threading.Thread(target=self.serve_http)
        http_server_thread.start()

        # Set up a signal handler for SIGINT
        signal.signal(signal.SIGINT, self.signal_handler)

        print("Hello everybody! I'm a plugin!")

        # Wait until the server is manually stopped
        self.server_stopped.wait()

    def serve_http(self):
        # Serve your HTML file on a specific port
        handler = http.server.SimpleHTTPRequestHandler
        with socketserver.TCPServer(("", self.port), handler) as httpd:
            print(f"Serving on port: {self.port}")
            self.http_server = httpd
            self.server_stopped.clear()  # Clear the event flag
            httpd.serve_forever()  # Serve forever until interrupted

    def signal_handler(self, sig, frame):
        # Gracefully shut down the HTTP server when SIGINT is received
        if self.http_server:
            print("Shutting down the server gracefully...")
            self.http_server.shutdown()
            self.server_stopped.set()  # Set the event flag to exit the main thread
