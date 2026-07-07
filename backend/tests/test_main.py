import app.main as main_module
from fastapi.testclient import TestClient
from datetime import datetime


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
