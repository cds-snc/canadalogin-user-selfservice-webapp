import pytest
import logging
import json

from app.auth.services.auth_user_session import get_users_current_session
from app.main import app
from fastapi.testclient import TestClient
from fastapi import HTTPException, status

client = TestClient(app, raise_server_exceptions=False)


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

    client.get("/v1/users/rp_info")

    record = caplog.records[1]
    log_json = json.loads(record.message)
    assert log_json["level"] == "WARNING"
    assert log_json["context"]["response"]["status_code"] == 400


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

    client.get("/v1/users/rp_info")

    record = caplog.records[1]
    log_json = json.loads(record.message)
    assert log_json["level"] == "ERROR"
    assert log_json["context"]["response"]["status_code"] == 500


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

    record = caplog.records[1]
    log_json = json.loads(record.message)
    assert log_json["context"]["request"]["method"] == "GET"
    assert log_json["context"]["request"]["path"] == "/v1/users/rp_info"


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

    payload = {
        "userName": "john.doe@example.com",
        "user_id": "user-123",
        "name": {"givenName": "John", "familyName": "Doe"},
    }

    client.post("/v1/users/profile", json=payload)

    record = caplog.records[1]
    log_json = json.loads(record.message)
    assert log_json["context"]["request"]["method"] == "POST"
    assert log_json["context"]["request"]["path"] == "/v1/users/profile"


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

    record = caplog.records[1]
    log_json = json.loads(record.message)
    assert log_json["context"]["request"]["query_string"] == "test=data"


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

    record = caplog.records[1]
    log_json = json.loads(record.message)
    assert (
        log_json["context"]["request"]["query_string"]
        == "test=data&secret=5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
    )


@pytest.mark.asyncio
async def test_log_signed_in(monkeypatch, caplog):
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

    monkeypatch.setattr(
        "app.utils.standardized_logging.get_user_info", mock_get_user_info
    )

    client.get("/v1/users/rp_info")

    record = caplog.records[1]
    log_json = json.loads(record.message)
    assert "user" in log_json["context"]
    assert (
        log_json["context"]["user"]["id"]
        == "ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f"
    )
    assert log_json["context"]["user"]["auth_methods"] == ["password"]


@pytest.mark.asyncio
async def test_log_signed_out(monkeypatch, caplog):
    caplog.set_level(logging.WARNING)

    def mock_auth_user_session():
        return {}

    app.dependency_overrides[get_users_current_session] = mock_auth_user_session

    def mock_500(*args, **kwargs):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error",
        )

    monkeypatch.setattr("app.users.v1_router.get_relying_party_info", mock_500)

    client.get("/v1/users/rp_info")

    record = caplog.records[1]
    log_json = json.loads(record.message)
    assert "user" not in log_json["context"]
