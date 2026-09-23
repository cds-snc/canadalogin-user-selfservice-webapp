"""Tests for CSRFMiddleware in isolation.

Deliberately avoids importing `app.main` (which pulls in authlib) so this file
can run even in environments where authlib/cryptography imports fail.
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware import csrf as csrf_module
from app.middleware.csrf import CSRFMiddleware, CSRF_TOKEN_KEY, CSRF_HEADER_NAME


@pytest.fixture(autouse=True)
def _no_domain_scoped_cookie(monkeypatch):
    # Some CI environments set ROOT_DOMAIN (e.g. test.com), which would scope the
    # CSRF cookie to that domain. TestClient's default host is "testserver", so a
    # domain-scoped cookie would be silently dropped by the cookie jar. These
    # tests exercise the token flow itself, not domain-scoping, so pin it to None.
    monkeypatch.setattr(csrf_module.configuration, "ROOT_DOMAIN", None)


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


def test_post_with_cross_site_fetch_metadata_is_rejected_even_with_valid_token():
    SessionInjectorMiddleware._store.clear()
    client = TestClient(build_app())

    client.get("/get")
    token = client.cookies.get(CSRF_TOKEN_KEY)

    response = client.post(
        "/post",
        headers={CSRF_HEADER_NAME: token, "sec-fetch-site": "cross-site"},
    )

    assert response.status_code == 403


def test_post_with_same_site_fetch_metadata_and_valid_token_is_accepted():
    SessionInjectorMiddleware._store.clear()
    client = TestClient(build_app())

    client.get("/get")
    token = client.cookies.get(CSRF_TOKEN_KEY)

    response = client.post(
        "/post",
        headers={CSRF_HEADER_NAME: token, "sec-fetch-site": "same-site"},
    )

    assert response.status_code == 200


def test_post_with_disallowed_origin_is_rejected_even_with_valid_token():
    SessionInjectorMiddleware._store.clear()
    client = TestClient(build_app())

    client.get("/get")
    token = client.cookies.get(CSRF_TOKEN_KEY)

    response = client.post(
        "/post",
        headers={CSRF_HEADER_NAME: token, "origin": "https://evil.example.com"},
    )

    assert response.status_code == 403


def test_post_with_allowed_origin_and_valid_token_is_accepted():
    SessionInjectorMiddleware._store.clear()
    client = TestClient(build_app())

    client.get("/get")
    token = client.cookies.get(CSRF_TOKEN_KEY)

    response = client.post(
        "/post",
        headers={CSRF_HEADER_NAME: token, "origin": "http://localhost:3000"},
    )

    assert response.status_code == 200
