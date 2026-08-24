import asyncio
import json
from typing import Dict, Any, Optional
from urllib.parse import urlparse, parse_qs


class ASGIResponse:
    def __init__(self, status_code: int, headers: dict, body: bytes):
        self.status_code = status_code
        self.headers = headers
        self.content = body

    def json(self) -> Any:
        return json.loads(self.content.decode("utf-8"))

    @property
    def text(self) -> str:
        return self.content.decode("utf-8")


class SimpleASGIClient:
    """
    Lightweight zero-dependency ASGI Client that directly executes FastAPI
    applications synchronously via asyncio event loop.
    """
    def __init__(self, app):
        self.app = app
        # Trigger lifespan startup
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        self.loop = loop

    def request(
        self,
        method: str,
        path: str,
        headers: Optional[Dict[str, str]] = None,
        json_data: Optional[Any] = None,
        content: Optional[bytes] = None,
    ) -> ASGIResponse:
        parsed = urlparse(path)
        path_only = parsed.path
        query_string = parsed.query.encode("latin-1")

        req_headers = []
        if headers:
            for k, v in headers.items():
                req_headers.append((k.lower().encode("latin-1"), v.encode("latin-1")))

        body_bytes = b""
        if json_data is not None:
            body_bytes = json.dumps(json_data).encode("utf-8")
            req_headers.append((b"content-type", b"application/json"))
        elif content is not None:
            body_bytes = content

        if body_bytes:
            req_headers.append((b"content-length", str(len(body_bytes)).encode("latin-1")))

        scope = {
            "type": "http",
            "asgi": {"version": "3.0", "spec_version": "2.1"},
            "http_version": "1.1",
            "method": method.upper(),
            "scheme": "http",
            "path": path_only,
            "raw_path": path_only.encode("latin-1"),
            "query_string": query_string,
            "root_path": "",
            "headers": req_headers,
            "client": ("127.0.0.1", 50000),
            "server": ("testserver", 80),
        }

        response_started = False
        response_status = 200
        response_headers = {}
        response_body = bytearray()

        async def receive():
            return {
                "type": "http.request",
                "body": body_bytes,
                "more_body": False,
            }

        async def send(message):
            nonlocal response_started, response_status, response_headers, response_body
            if message["type"] == "http.response.start":
                response_started = True
                response_status = message["status"]
                for k, v in message.get("headers", []):
                    response_headers[k.decode("latin-1").lower()] = v.decode("latin-1")
            elif message["type"] == "http.response.body":
                response_body.extend(message.get("body", b""))

        async def run():
            await self.app(scope, receive, send)

        self.loop.run_until_complete(run())
        return ASGIResponse(response_status, response_headers, bytes(response_body))

    def get(self, path: str, headers: Optional[Dict[str, str]] = None) -> ASGIResponse:
        return self.request("GET", path, headers=headers)

    def post(
        self,
        path: str,
        json: Optional[Any] = None,
        content: Optional[bytes] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> ASGIResponse:
        return self.request("POST", path, headers=headers, json_data=json, content=content)

    def patch(
        self,
        path: str,
        json: Optional[Any] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> ASGIResponse:
        return self.request("PATCH", path, headers=headers, json_data=json)

    def delete(self, path: str, headers: Optional[Dict[str, str]] = None) -> ASGIResponse:
        return self.request("DELETE", path, headers=headers)

