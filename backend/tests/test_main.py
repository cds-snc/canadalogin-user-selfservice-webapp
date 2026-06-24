import app.main as main_module
from fastapi.testclient import TestClient
from datetime import datetime


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
    routes = {route.path for route in app.routes}

    assert "/v1/identity-verification/online" not in routes
    assert "/v1/identity-verification/online/mock-success-response" not in routes


def test_create_app_includes_identity_verification_routes_in_dev(monkeypatch):
    monkeypatch.setattr(main_module.configuration, "ENVIRONMENT", "dev")

    app = main_module.create_app()
    routes = {route.path for route in app.routes}

    assert "/v1/identity-verification/online" in routes
    assert "/v1/identity-verification/online/mock-success-response" in routes
