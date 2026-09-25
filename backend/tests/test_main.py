import app.main as main_module
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.csrf import CSRF_HEADER_NAME, CSRF_TOKEN_KEY
from fastapi.testclient import TestClient
from fastapi import FastAPI
from fastapi.responses import Response
from datetime import datetime
from starsessions import SessionAutoloadMiddleware, SessionMiddleware
from starsessions.stores import InMemoryStore


class InjectSessionMiddleware:
    def __init__(self, app, session_data=None):
        self.app = app
        self.session_data = session_data or {}

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            scope["session"] = dict(self.session_data)
        await self.app(scope, receive, send)


def get_all_route_paths(app):
    """Collect all route paths from the app, including routes nested in included routers."""
    paths = set()

    def collect(routes, prefix=""):
        for route in routes:
            if hasattr(route, "path"):
                paths.add(prefix + route.path)
            # Handle _IncludedRouter objects introduced in FastAPI >= 0.137
            elif (
                hasattr(route, "original_router")
                and hasattr(route, "include_context")
                and hasattr(route.original_router, "routes")
            ):
                sub_prefix = getattr(route.include_context, "prefix", "")
                collect(route.original_router.routes, sub_prefix)

    collect(app.routes)
    return paths


def build_isolated_client(app):
    app.user_middleware = [
        middleware
        for middleware in app.user_middleware
        if middleware.cls not in {SessionMiddleware, SessionAutoloadMiddleware}
    ]
    app.middleware_stack = app.build_middleware_stack()
    return TestClient(app, raise_server_exceptions=False)


def test_app_starts():
    client = build_isolated_client(main_module.create_app())
    response = client.get("/health/health")
    print(response.json())
    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "timestamp": datetime.today().strftime("%Y-%m-%d %H:%M:%S"),
        "service": "gc-signin-backend",
    }
    assert response.headers["content-security-policy"] == (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self'; "
        "img-src 'self' data:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self';"
    )
    assert response.headers["cross-origin-opener-policy"] == "same-origin"
    assert response.headers["cross-origin-resource-policy"] == "same-site"
    assert response.headers["permissions-policy"] == (
        "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), "
        "microphone=(), payment=(), usb=()"
    )
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-dns-prefetch-control"] == "off"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["x-permitted-cross-domain-policies"] == "none"
    assert response.headers["x-robots-tag"] == "noindex, nofollow"
    assert response.headers["x-xss-protection"] == "0"
    assert "strict-transport-security" not in response.headers


def test_create_app_adds_hsts_outside_local(monkeypatch):
    monkeypatch.setattr(main_module.configuration, "ENVIRONMENT", "prod")

    app = main_module.create_app()
    client = build_isolated_client(app)
    response = client.get("/health/health")

    assert response.headers["strict-transport-security"] == (
        "max-age=31536000; includeSubDomains"
    )


def test_create_app_csp_img_src_is_environment_independent(monkeypatch):
    monkeypatch.setattr(main_module.configuration, "ENVIRONMENT", "prod")

    app = main_module.create_app()
    client = build_isolated_client(app)
    response = client.get("/health/health")

    # img-src does not allow http: or https: since all images are bundled locally
    assert "img-src 'self' data:; " in response.headers["content-security-policy"]
    assert "http:" not in response.headers["content-security-policy"]
    assert "https:" not in response.headers["content-security-policy"]


def test_security_headers_middleware_skips_hsts_locally():
    app = FastAPI()

    @app.get("/health")
    async def read_health():
        return {"status": "ok"}

    app.add_middleware(SecurityHeadersMiddleware)

    client = TestClient(app)
    response = client.get("/health")

    assert "strict-transport-security" not in response.headers


def test_security_headers_middleware_sets_no_store_on_authenticated_response():
    app = FastAPI()

    @app.get("/profile")
    async def profile():
        return {"status": "ok"}

    app.add_middleware(
        InjectSessionMiddleware,
        session_data={"access_token": "token-value"},
    )
    app.add_middleware(SecurityHeadersMiddleware)

    client = TestClient(app)
    response = client.get("/profile")

    assert response.headers["cache-control"] == "no-store"
    assert "cookie" in response.headers["vary"].lower()


def test_security_headers_middleware_preserves_existing_cache_control():
    app = FastAPI()

    @app.get("/events")
    async def events():
        return Response(
            content="ok",
            media_type="text/plain",
            headers={"Cache-Control": "no-cache"},
        )

    app.add_middleware(
        InjectSessionMiddleware,
        session_data={"token": {"userinfo": {"sub": "123"}}},
    )
    app.add_middleware(SecurityHeadersMiddleware)

    client = TestClient(app)
    response = client.get("/events")

    assert response.headers["cache-control"] == "no-cache"
    assert "cookie" in response.headers["vary"].lower()


def test_create_app_docs_are_forced_to_use_strict_csp():
    client = build_isolated_client(main_module.create_app())
    response = client.get("/docs")

    assert response.status_code == 200
    assert response.headers["content-security-policy"] == (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self'; "
        "img-src 'self' data:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self';"
    )


def test_create_app_csrf_flow_uses_real_session_middlewares(monkeypatch):
    class InMemoryRedisStore(InMemoryStore):
        def __init__(self, *args, **kwargs):
            super().__init__()

    monkeypatch.setattr(main_module, "RedisStore", InMemoryRedisStore)
    # CI sets ROOT_DOMAIN (e.g. test.com), which would scope the CSRF cookie to
    # that domain. TestClient's default host is "testserver", so a domain-scoped
    # cookie would be silently dropped by the cookie jar; pin it to None since
    # this test exercises the CSRF/session flow, not domain-scoping.
    monkeypatch.setattr(main_module.configuration, "ROOT_DOMAIN", None)
    app = main_module.create_app()

    @app.get("/csrf-test")
    async def csrf_get():
        return {"ok": True}

    @app.post("/csrf-test")
    async def csrf_post():
        return {"ok": True}

    client = TestClient(app, raise_server_exceptions=False)

    get_response = client.get("/csrf-test")
    csrf_token = get_response.cookies.get(CSRF_TOKEN_KEY)

    assert get_response.status_code == 200
    assert csrf_token is not None

    post_response = client.post(
        "/csrf-test",
        headers={CSRF_HEADER_NAME: csrf_token},
    )

    assert post_response.status_code == 200
    assert post_response.json() == {"ok": True}


def test_create_app_excludes_identity_verification_routes_outside_local_and_dev(
    monkeypatch,
):
    monkeypatch.setattr(main_module.configuration, "ENVIRONMENT", "prod")

    app = main_module.create_app()
    routes = get_all_route_paths(app)

    assert "/v1/identity-verification/online" not in routes
    assert "/v1/identity-verification/online/mock-success-response" not in routes


def test_create_app_includes_identity_verification_routes_in_dev(monkeypatch):
    monkeypatch.setattr(main_module.configuration, "ENVIRONMENT", "dev")

    app = main_module.create_app()
    routes = get_all_route_paths(app)

    assert "/v1/identity-verification/online" in routes
    assert "/v1/identity-verification/online/mock-success-response" in routes
