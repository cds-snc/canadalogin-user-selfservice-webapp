from app.main import app
from fastapi.testclient import TestClient
from datetime import datetime


def test_app_starts():
    client = TestClient(app)
    response = client.get("/health/health")
    print(response.json())
    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "timestamp": datetime.today().strftime("%Y-%m-%d %H:%M:%S"),
        "service": "gc-signin-backend",
    }
