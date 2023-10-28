import asyncio
import http.server
import threading
import webbrowser
from urllib.parse import urlparse

import websockets
from beets.plugins import BeetsPlugin
from beets.ui import Subcommand


class EditMonacoPlugin(BeetsPlugin):
    http_port = 8888
    websocket_port = 8889
    http_server = None
    http_server_stopped = threading.Event()

    def commands(self):
        command = Subcommand("editmonaco", help="Launch monaco editors")
        command.func = self.test_command
        return [command]

    def test_command(self, lib, opts, args):
        print("Starting HTTP server")
        self.server_http_thread = threading.Thread(target=self.serve_http, daemon=True)
        self.server_http_thread.start()

        print("Starting websocket server")
        asyncio.run(self.serve_websocket())

    async def serve_websocket(self):
        self.websocket_server = await websockets.serve(
            self.handler,
            "",
            self.websocket_port,
        )
        print(f"Serving websocket on port {self.websocket_port}")
        await self.websocket_server.wait_closed()

    def serve_http(self):
        handler = http.server.SimpleHTTPRequestHandler
        server_ready = threading.Event()

        def _server_thread() -> None:
            nonlocal server_ready
            with http.server.HTTPServer(("", self.http_port), handler) as httpd:
                server_ready.set()
                print(f"Serving HTTP on port {self.http_port}")
                httpd.serve_forever()

        server_thread = threading.Thread(target=_server_thread)
        server_thread.daemon = True
        server_thread.start()
        server_ready.wait()
        webbrowser.open(f"http://localhost:{self.http_port}")

    async def handler(self, websocket):
        while True:
            message = await websocket.recv()
            print(message)
            if message == "Message from web interface!":
                await websocket.send("Message from server!")


if __name__ == "__main__":
    plugin = EditMonacoPlugin()
    plugin.test_command(None, None, None)
