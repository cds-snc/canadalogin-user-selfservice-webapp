"""Tests for CSRFMiddleware in isolation.

Deliberately avoids importing `app.main` (which pulls in authlib) so this file
can run even in environments where authlib/cryptography imports fail.
"""

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware.csrf import CSRFMiddleware, CSRF_TOKEN_KEY, CSRF_HEADER_NAME


class SessionInjectorMiddleware:
    """Stand-in for starsessions: stores the session dict on scope, keyed by cookie."""

    _store: dict = {}

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            headers = dict(scope["headers"])
            cookie_header = headers.get(b"cookie", b"").decode()
            session_id = None
            for part in cookie_header.split(";"):
                if part.strip().startswith("sid="):
                    session_id = part.strip().split("=", 1)[1]
            if session_id is None or session_id not in self._store:
                session_id = "test-session"
                self._store.setdefault(session_id, {})
            scope["session"] = self._store[session_id]
        await self.app(scope, receive, send)


def build_app() -> FastAPI:
    app = FastAPI()

    @app.get("/get")
    async def get_endpoint():
        return {"ok": True}

    @app.post("/post")
    async def post_endpoint():
        return {"ok": True}

    app.add_middleware(CSRFMiddleware)
    app.add_middleware(SessionInjectorMiddleware)
    return app


def test_get_request_issues_csrf_cookie():
    SessionInjectorMiddleware._store.clear()
    client = TestClient(build_app())

    response = client.get("/get")

    assert response.status_code == 200
    assert CSRF_TOKEN_KEY in response.cookies


def test_post_without_csrf_header_is_rejected():
    SessionInjectorMiddleware._store.clear()
    client = TestClient(build_app())

    response = client.post("/post")

    assert response.status_code == 403


def test_post_without_session_is_rejected():
    app = FastAPI()

    @app.post("/post")
    async def post_endpoint():
        return {"ok": True}

    app.add_middleware(CSRFMiddleware)
    client = TestClient(app)

    response = client.post("/post")

    assert response.status_code == 403


def test_post_with_matching_csrf_header_is_accepted():
    SessionInjectorMiddleware._store.clear()
    client = TestClient(build_app())

    client.get("/get")
    token = client.cookies.get(CSRF_TOKEN_KEY)

    response = client.post("/post", headers={CSRF_HEADER_NAME: token})

    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_post_with_mismatched_csrf_header_is_rejected():
    SessionInjectorMiddleware._store.clear()
    client = TestClient(build_app())

    client.get("/get")

    response = client.post("/post", headers={CSRF_HEADER_NAME: "wrong-token"})

    assert response.status_code == 403
