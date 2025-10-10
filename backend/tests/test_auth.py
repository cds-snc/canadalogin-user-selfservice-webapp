# pytest + pytest-asyncio
from enum import Enum
from types import SimpleNamespace
from urllib.parse import quote
from http.cookies import SimpleCookie
import uuid
from typing import Dict, Any

import pytest
import pytest_asyncio
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

import httpx
from httpx import AsyncClient, MockTransport, Response, ASGITransport

# Import your module under test directly from your app package
import app.auth.services.auth as auth_module


# =============================================================================
#  In-file ASGI Session Middleware (no external SessionMiddleware dependency)
# =============================================================================


class InMemorySessionMiddleware:
    """
    Minimal cookie-backed session middleware for tests.

    - Looks for 'sid' cookie; if not present, creates one.
    - Stores per-session dicts in a local memory store keyed by sid.
    - Injects scope["session"] so Request.session works.
    - Sets 'Set-Cookie: sid=...' on responses to persist session.
    """

    def __init__(self, app, cookie_name: str = "sid"):
        self.app = app
        self.cookie_name = cookie_name
        self._store: Dict[str, Dict[str, Any]] = {}

    def _get_sid(self, headers):
        cookie_header = None
        for name, value in headers or []:
            if name.lower() == b"cookie":
                cookie_header = value.decode("latin-1")
                break
        if cookie_header:
            jar = SimpleCookie()
            jar.load(cookie_header)
            morsel = jar.get(self.cookie_name)
            if morsel and morsel.value:
                return morsel.value
        return uuid.uuid4().hex

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        sid = self._get_sid(scope.get("headers"))
        session = self._store.setdefault(sid, {})
        scope["session"] = session  # FastAPI's Request.session reads this

        set_cookie_added = False

        async def send_wrapper(message):
            nonlocal set_cookie_added
            if message["type"] == "http.response.start":
                headers = message.setdefault("headers", [])
                if not set_cookie_added:
                    cookie_value = f"{self.cookie_name}={sid}; Path=/; HttpOnly"
                    headers.append((b"set-cookie", cookie_value.encode("latin-1")))
                    set_cookie_added = True
            await send(message)

        await self.app(scope, receive, send_wrapper)


# =============================================================================
#  Helpers / Fakes
# =============================================================================


class FakeSessionKeys(Enum):
    CALLBACK_ROUTE_NAME = "auth_callback"
    RETURN_TO_PAGE = "returnToPage"


class FakeConfig:
    def __init__(self, env="prod", domain="pm.example.com"):
        self.ENVIRONMENT = env
        self.PROFILE_MANAGEMENT_DOMAIN = domain


class FakeSessionHandler:
    def __init__(self):
        self.session_id = None


class FakeVerifyClient:
    """
    A minimal 'verify' client that uses httpx.AsyncClient with a MockTransport.
    We do NOT mock httpx itself.
    """

    def __init__(self, transport: MockTransport):
        self._client = httpx.AsyncClient(
            transport=transport, base_url="https://idp.example"
        )
        self.last_authorize_redirect_kwargs = {}

    async def authorize_redirect(self, request: Request, redirect_uri: str, **kwargs):
        # Record kwargs (e.g., max_age) so tests can assert
        self.last_authorize_redirect_kwargs = dict(kwargs)
        # Emulate building an authorize redirect
        location = (
            f"https://idp.example/authorize?redirect_uri={quote(redirect_uri, safe='')}"
        )
        return JSONResponse(
            status_code=302, content=None, headers={"Location": location}
        )

    async def authorize_access_token(self, request: Request):
        # Emulate a token exchange using the MockTransport-driven client
        resp = await self._client.post(
            "/token", data={"grant_type": "authorization_code", "code": "abc"}
        )
        data = resp.json()
        # Return structure expected by auth.callback_handler(): must contain userinfo.sid
        return {
            "access_token": data.get("access_token", "token123"),
            "userinfo": {"sid": "test-session-id"},
        }


class RaisingVerifyClient(FakeVerifyClient):
    def __init__(self, exc):
        # No HTTP client needed, we raise immediately
        self._client = None
        self.exc = exc
        self.last_authorize_redirect_kwargs = {}

    async def authorize_access_token(self, request: Request):
        raise self.exc


# =============================================================================
#  Pytest fixtures
# =============================================================================


@pytest.fixture
def mock_token_transport():
    """MockTransport that returns a canned token response for POST /token"""

    def handler(request: httpx.Request) -> Response:
        if request.url.host == "idp.example" and request.url.path == "/token":
            return Response(200, json={"access_token": "token-xyz"})
        return Response(404, json={"error": "not found"})

    return MockTransport(handler)


@pytest.fixture
def app(monkeypatch, mock_token_transport):
    """
    Build a minimal FastAPI app with the routes needed to exercise auth.py.
    All external dependencies used by auth.py are monkeypatched with in-file fakes.
    """
    # Map auth.py imports to in-file fakes
    monkeypatch.setattr(auth_module, "SessionKeys", FakeSessionKeys, raising=True)
    monkeypatch.setattr(
        auth_module,
        "get_configuration",
        lambda: FakeConfig(env="prod", domain="pm.example.com"),
        raising=True,
    )

    # Provide a fake session handler factory
    def fake_get_session_handler(request: Request):
        return FakeSessionHandler()

    # auth.py imported: from starsessions.session import get_session_handler
    # we monkeypatch the imported symbol inside auth_module
    monkeypatch.setattr(
        auth_module, "get_session_handler", fake_get_session_handler, raising=True
    )

    # Provide a no-op update_session_tokens that records call and writes to session
    called = {}

    def update_session_tokens(request: Request, oidc_response: dict):
        called["last"] = dict(oidc_response)
        request.session["access_token"] = oidc_response.get("access_token")

    monkeypatch.setattr(
        auth_module, "update_session_tokens", update_session_tokens, raising=True
    )

    # Provide a fake oauth.verify client that uses MockTransport under the hood
    fake_verify = FakeVerifyClient(mock_token_transport)
    oauth_ns = SimpleNamespace(verify=fake_verify)
    monkeypatch.setattr(auth_module, "oauth", oauth_ns, raising=True)

    # Build ASGI app with our in-file session middleware
    base = FastAPI()
    base.add_middleware(InMemorySessionMiddleware)

    # The callback route that auth.get_callback_redirect_uri() will resolve to
    @base.get("/auth/callback", name=FakeSessionKeys.CALLBACK_ROUTE_NAME.value)
    async def auth_callback_endpoint(request: Request):
        return await auth_module.callback_handler(request)

    # A probe route to call get_callback_redirect_uri within a request context
    @base.get("/probe")
    async def probe(request: Request):
        url = auth_module.get_callback_redirect_uri(request)
        return {"url": url}

    # Login and Reauth entry points
    @base.get("/login")
    async def login(request: Request):
        return await auth_module.redirect_user_to_idp_verify(request)

    @base.get("/reauth")
    async def reauth(request: Request, returnToPage: str = "/"):
        return await auth_module.reauthenticate_user(request, returnToPage=returnToPage)

    # Utilities to seed & read session in tests
    @base.get("/seed-session")
    async def seed_session(request: Request, path: str = "/home"):
        request.session[FakeSessionKeys.RETURN_TO_PAGE.value] = path
        return {"ok": True}

    @base.get("/session-dump")
    async def session_dump(request: Request):
        return dict(request.session)

    # Expose useful bits for assertions
    base.state.oauth_verify = fake_verify
    base.state.update_called = called

    return base


# IMPORTANT: async fixture must use pytest_asyncio.fixture (not pytest.fixture)


@pytest_asyncio.fixture
async def client(app):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as ac:
        yield ac


# =============================================================================
#  Tests
# =============================================================================


def test_get_base_profile_management_url_local(monkeypatch):
    # For local env, no https prefix should be added
    monkeypatch.setattr(
        auth_module,
        "get_configuration",
        lambda: FakeConfig(env="local", domain="pm.local:3000"),
        raising=True,
    )
    assert auth_module.get_base_profile_management_url() == "pm.local:3000"


def test_get_base_profile_management_url_nonlocal(monkeypatch):
    monkeypatch.setattr(
        auth_module,
        "get_configuration",
        lambda: FakeConfig(env="prod", domain="pm.example.com"),
        raising=True,
    )
    assert auth_module.get_base_profile_management_url() == "https://pm.example.com"


@pytest.mark.asyncio
async def test_get_callback_redirect_uri_enforces_https(app, client, monkeypatch):
    # Ensure environment is non-local so http->https rewrite occurs
    monkeypatch.setattr(
        auth_module,
        "get_configuration",
        lambda: FakeConfig(env="prod", domain="pm.example.com"),
        raising=True,
    )
    r = await client.get("/probe")
    r.raise_for_status()
    url = r.json()["url"]
    assert url == "https://testserver/auth/callback"


@pytest.mark.asyncio
async def test_redirect_user_to_idp_verify_redirects(app, client):
    resp = await client.get("/login", follow_redirects=False)
    assert resp.status_code in (302, 307)
    assert resp.headers["location"].startswith("https://idp.example/authorize?")


@pytest.mark.asyncio
async def test_callback_handler_success_flow_sets_session_and_redirects(app, client):
    # Seed session with RETURN_TO_PAGE so the final redirect includes it
    await client.get("/seed-session", params={"path": "/dashboard"})
    resp = await client.get("/auth/callback", follow_redirects=False)

    assert resp.status_code in (302, 307)
    assert (
        resp.headers["location"]
        == "https://pm.example.com/dashboard?returnToPage=/dashboard"
    )


@pytest.mark.asyncio
async def test_callback_handler_sets_new_session_id_and_updates_tokens(
    app, client, monkeypatch
):
    # Replace get_session_handler to expose the handler so we can assert session_id was set
    handler_holder = {}

    def fake_get_session_handler(request: Request):
        handler_holder["h"] = FakeSessionHandler()
        return handler_holder["h"]

    monkeypatch.setattr(
        auth_module, "get_session_handler", fake_get_session_handler, raising=True
    )

    await client.get("/seed-session", params={"path": "/home"})
    resp = await client.get("/auth/callback", follow_redirects=False)
    assert resp.status_code in (302, 307)

    # Ensure session handler got a new session id from userinfo.sid
    assert handler_holder["h"].session_id == "test-session-id"

    # Ensure update_session_tokens was called and access_token stored into session (via our monkeypatch)
    dump = await client.get("/session-dump")
    assert dump.status_code == 200
    assert dump.json().get("access_token") == "token-xyz"


@pytest.mark.asyncio
async def test_callback_handler_oauth_error_results_in_500(app, monkeypatch):
    """
    For this test we want to assert the HTTP 500 response rather than have
    the app exception bubble up, so use an ASGITransport with
    raise_app_exceptions=False for this single request.
    """
    # Arrange: make oauth.verify.authorize_access_token raise OAuthError
    OAuthError = auth_module.OAuthError  # from authlib, imported by auth.py
    raising_client = RaisingVerifyClient(OAuthError("boom"))
    monkeypatch.setattr(auth_module.oauth, "verify", raising_client, raising=True)

    # Use a dedicated client that does NOT re-raise app exceptions
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        resp = await ac.get("/auth/callback", follow_redirects=False)

    assert resp.status_code == 500  # Inspect the 500 response instead of exception


@pytest.mark.asyncio
async def test_reauthenticate_user_sets_returnToPage_and_passes_max_age(app, client):
    resp = await client.get(
        "/reauth", params={"returnToPage": "/reports"}, follow_redirects=False
    )
    assert resp.status_code in (302, 307)
    assert resp.headers["location"].startswith(
        "https://idp.example/authorize?redirect_uri="
    )

    # Confirm session now contains RETURN_TO_PAGE
    dump = await client.get("/session-dump")
    assert dump.status_code == 200
    assert dump.json().get(FakeSessionKeys.RETURN_TO_PAGE.value) == "/reports"

    # Confirm we passed max_age=900 to authorize_redirect()
    assert app.state.oauth_verify.last_authorize_redirect_kwargs.get("max_age") == 900
