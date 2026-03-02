import pytest
import logging

from app.auth.services.auth_user_session import get_users_current_session
from app.main import app
from fastapi.testclient import TestClient
from fastapi import HTTPException, status

client = TestClient(app)


@pytest.mark.asyncio
async def test_log_status_400(monkeypatch, caplog):
    caplog.set_level(logging.WARNING)

    def mock_auth_user_session():
        return {}

    app.dependency_overrides[get_users_current_session] = mock_auth_user_session

    def mock_400(*args, **kwargs):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Bad Request"
        )

    monkeypatch.setattr("app.users.v1_router.get_relying_party_info", mock_400)

    response = client.get("/v1/users/rp_info")

    assert "'response': {'status_code': 400}" in caplog.text
    assert "'level': 'WARNING'" in caplog.text
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_log_status_500(monkeypatch, caplog):
    caplog.set_level(logging.WARNING)

    def mock_auth_user_session():
        return {}

    app.dependency_overrides[get_users_current_session] = mock_auth_user_session

    def mock_500(*args, **kwargs):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Erroer",
        )

    monkeypatch.setattr("app.users.v1_router.get_relying_party_info", mock_500)

    response = client.get("/v1/users/rp_info")

    assert "'response': {'status_code': 500}" in caplog.text
    assert "'level': 'ERROR'" in caplog.text
    assert response.status_code == 500


@pytest.mark.asyncio
async def test_log_request_get(monkeypatch, caplog):
    caplog.set_level(logging.WARNING)

    def mock_auth_user_session():
        return {}

    app.dependency_overrides[get_users_current_session] = mock_auth_user_session

    def mock_500(*args, **kwargs):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Erroer",
        )

    monkeypatch.setattr("app.users.v1_router.get_relying_party_info", mock_500)

    client.get("/v1/users/rp_info")

    assert "'method': 'GET'" in caplog.text
    assert "'path': '/v1/users/rp_info'" in caplog.text


@pytest.mark.asyncio
async def test_log_request_post(monkeypatch, caplog):
    caplog.set_level(logging.WARNING)

    def mock_auth_user_session():
        return {}

    app.dependency_overrides[get_users_current_session] = mock_auth_user_session

    def mock_500(*args, **kwargs):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Erroer",
        )

    monkeypatch.setattr(
        "app.users.v1_router.validate_user_id_matches_session", mock_500
    )

    client.post("/v1/users/profile")

    assert "'method': 'POST'" in caplog.text
    assert "'path': '/v1/users/profile'" in caplog.text


@pytest.mark.asyncio
async def test_log_request_query_string(monkeypatch, caplog):
    caplog.set_level(logging.WARNING)

    def mock_auth_user_session():
        return {}

    app.dependency_overrides[get_users_current_session] = mock_auth_user_session

    def mock_500(*args, **kwargs):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Erroer",
        )

    monkeypatch.setattr("app.users.v1_router.get_relying_party_info", mock_500)

    client.get("/v1/users/rp_info?test=data")

    assert "'query_string': 'test=data'" in caplog.text


@pytest.mark.asyncio
async def test_log_request_query_string_blacklist(monkeypatch, caplog):
    caplog.set_level(logging.WARNING)

    def mock_auth_user_session():
        return {}

    app.dependency_overrides[get_users_current_session] = mock_auth_user_session

    def mock_500(*args, **kwargs):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Erroer",
        )

    monkeypatch.setattr("app.users.v1_router.get_relying_party_info", mock_500)

    client.get("/v1/users/rp_info?test=data&secret=password")

    assert (
        "'query_string': 'test=data&secret=5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'"
        in caplog.text
    )


@pytest.mark.asyncio
async def test_log_user(monkeypatch, caplog):
    caplog.set_level(logging.WARNING)

    def mock_auth_user_session():
        return {}

    app.dependency_overrides[get_users_current_session] = mock_auth_user_session

    def mock_500(*args, **kwargs):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Erroer",
        )

    monkeypatch.setattr("app.users.v1_router.get_relying_party_info", mock_500)

    async def mock_get_user_info(*args, **kwargs):
        return {"sub": "12345678", "amr": ["password"]}

    monkeypatch.setattr("app.middleware.logging.get_user_info", mock_get_user_info)

    client.get("/v1/users/rp_info")

    assert "user" in caplog.text
    assert (
        "'id': 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f'"
        in caplog.text
    )
    assert "'auth_methods': ['password']" in caplog.text


@pytest.mark.asyncio
async def test_log_no_user(monkeypatch, caplog):
    caplog.set_level(logging.WARNING)

    def mock_auth_user_session():
        return {}

    app.dependency_overrides[get_users_current_session] = mock_auth_user_session

    def mock_500(*args, **kwargs):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Erroer",
        )

    monkeypatch.setattr("app.users.v1_router.get_relying_party_info", mock_500)

    client.get("/v1/users/rp_info")

    assert "'user" not in caplog.text
