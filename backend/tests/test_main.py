import app.main as main_module
from app.middleware import SecurityHeadersMiddleware
from fastapi.testclient import TestClient
from fastapi import FastAPI
from fastapi.responses import Response
from datetime import datetime


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


def test_app_starts():
    client = TestClient(main_module.app)
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
        "img-src 'self' data: http: https:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "upgrade-insecure-requests"
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
    client = TestClient(app)
    response = client.get("/health/health")

    assert response.headers["strict-transport-security"] == (
        "max-age=31536000; includeSubDomains"
    )


def test_create_app_uses_https_only_csp_in_production(monkeypatch):
    monkeypatch.setattr(main_module.configuration, "ENVIRONMENT", "prod")

    app = main_module.create_app()
    client = TestClient(app)
    response = client.get("/health/health")

    # Production CSP should use https only, not http
    assert (
        "img-src 'self' data: https:; " in response.headers["content-security-policy"]
    )
    assert "http:" not in response.headers["content-security-policy"]


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
    client = TestClient(main_module.app)
    response = client.get("/docs")

    assert response.status_code == 200
    assert response.headers["content-security-policy"] == (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self'; "
        "img-src 'self' data: http: https:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "upgrade-insecure-requests"
    )


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
