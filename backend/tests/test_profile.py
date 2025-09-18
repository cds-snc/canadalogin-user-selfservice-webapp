import pytest
import httpx
from httpx import MockTransport, AsyncClient
from fastapi import Request as FastAPIRequest, HTTPException
from types import SimpleNamespace
from starlette.datastructures import Headers
from datetime import datetime, timezone
from unittest.mock import AsyncMock

from app.users.services.profile import (
    sanitize_user_profile_data,
    dispatch_update_user_profile,
    update_profile,
    my_profile,
)
from app.users.schemas import (
    UserProfileUpdateRequest,
    IBMVerifyUpdateUserProfile,
    ProfileResponse,
    UserProfileName,
)


# ----------------------------
# Fixtures
# ----------------------------


@pytest.fixture
def fake_profile_data():
    return {
        "id": "user-123",
        "userName": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "1234567890",
        "emails": [{"type": "work", "value": "john@example.com", "primary": True}],
        "meta": {
            "resourceType": "User",
            "created": datetime.now(timezone.utc).isoformat(),
            "lastModified": datetime.now(timezone.utc).isoformat(),
            "location": "/Users/user-123",
        },
        "active": True,
    }


@pytest.fixture
def update_request():
    return UserProfileUpdateRequest(
        userName="john@example.com",
        name=UserProfileName(givenName="Johnny"),
    )


@pytest.fixture
def user_token():
    return "mock-user-token"


@pytest.fixture
def make_request(mock_app):
    def _make_request(app):
        return FastAPIRequest(
            scope={"type": "http", "app": app, "headers": Headers({}).raw}
        )

    return _make_request


@pytest.fixture
def mock_app():
    def _app_with_transport(transport):
        class MockAppState:
            def __init__(self):
                self.request_client = AsyncClient(
                    transport=transport, base_url="http://testserver"
                )
                self.config = SimpleNamespace(
                    profile_api_endpoint="http://testserver/v2.0/Me"
                )

        class MockApp:
            def __init__(self):
                self.state = MockAppState()

        return MockApp()

    return _app_with_transport


# ----------------------------
# Tests
# ----------------------------


def test_sanitize_user_profile_data():
    update_request_obj = UserProfileUpdateRequest(
        userName="john@example.com", name=UserProfileName(givenName="Johnny")
    )
    result = sanitize_user_profile_data(update_request_obj)

    assert "userName" in result
    assert result["userName"] == "john@example.com"
    assert "name" in result
    assert isinstance(result["name"], dict)
    assert result["name"].get("givenName") == "Johnny"


@pytest.mark.asyncio
async def test_dispatch_update_user_profile_success(
    user_token, fake_profile_data, mock_app, make_request
):
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "PUT"
        response = httpx.Response(
            status_code=200,
            json=fake_profile_data,
            request=request,
        )
        # Patch raise_for_status to be awaitable and succeed
        response.raise_for_status = AsyncMock()
        return response

    transport = MockTransport(handler)
    app = mock_app(transport)
    req = make_request(app)

    profile_obj = IBMVerifyUpdateUserProfile(**fake_profile_data)
    payload = profile_obj.model_dump_json(by_alias=True, exclude_none=True)

    response = await dispatch_update_user_profile(req, payload, user_token)

    assert response.status_code == 200
    resp_json = response.json()
    assert resp_json["userName"] == fake_profile_data["userName"]
    assert resp_json["id"] == fake_profile_data["id"]


@pytest.mark.asyncio
async def test_update_profile_success(
    update_request, fake_profile_data, user_token, mock_app, make_request
):
    def handler(request: httpx.Request) -> httpx.Response:
        if request.method == "GET":
            response = httpx.Response(
                status_code=200,
                json=fake_profile_data,
                request=request,
            )
            response.raise_for_status = AsyncMock()
            return response
        elif request.method == "PUT":
            merged = {**fake_profile_data, **update_request.model_dump()}
            merged.setdefault("emails", fake_profile_data["emails"])
            merged.setdefault("meta", fake_profile_data["meta"])
            response = httpx.Response(
                status_code=200,
                json=merged,
                request=request,
            )
            response.raise_for_status = AsyncMock()
            return response
        else:
            response = httpx.Response(
                status_code=404,
                json={"detail": "Not Found"},
                request=request,
            )
            response.raise_for_status = AsyncMock()
            return response

    transport = MockTransport(handler)
    app = mock_app(transport)
    req = make_request(app)

    result = await update_profile(req, update_request, user_token)

    assert isinstance(result, ProfileResponse)
    assert result.success is True
    assert result.data.name.givenName == "Johnny"


@pytest.mark.asyncio
async def test_update_profile_user_mismatch(
    update_request, fake_profile_data, user_token, mock_app, make_request
):
    mismatched = {**fake_profile_data, "userName": "wrong@example.com"}

    def handler(request: httpx.Request) -> httpx.Response:
        if request.method == "GET":
            response = httpx.Response(
                status_code=200,
                json=mismatched,
                request=request,
            )
            response.raise_for_status = AsyncMock()
            return response
        else:
            response = httpx.Response(
                status_code=404,
                json={"detail": "Not Found"},
                request=request,
            )
            response.raise_for_status = AsyncMock()
            return response

    transport = MockTransport(handler)
    app = mock_app(transport)
    req = make_request(app)

    with pytest.raises(HTTPException) as excinfo:
        await update_profile(req, update_request, user_token)

    assert excinfo.value.status_code == 403
    assert "User mismatch" in str(excinfo.value.detail)


@pytest.mark.asyncio
async def test_my_profile_success(fake_profile_data, user_token, mock_app):
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "GET"
        response = httpx.Response(
            status_code=200,
            json=fake_profile_data,
            request=request,
        )
        response.raise_for_status = AsyncMock()
        return response

    transport = MockTransport(handler)
    client = AsyncClient(transport=transport, base_url="http://testserver")

    response = await my_profile(client, user_token)

    assert isinstance(response, ProfileResponse)
    assert response.data.userName == fake_profile_data["userName"]
    assert response.data.id == fake_profile_data["id"]
    assert response.data.meta.resourceType == fake_profile_data["meta"]["resourceType"]
    assert response.data.active == fake_profile_data["active"]


@pytest.mark.asyncio
async def test_my_profile_unauthorized(user_token):
    def handler(request: httpx.Request) -> httpx.Response:
        response = httpx.Response(
            status_code=401,
            json={"detail": "Not authenticated"},
            request=request,
        )
        response.raise_for_status = AsyncMock(
            side_effect=httpx.HTTPStatusError(
                message="Unauthorized",
                request=request,
                response=response,
            )
        )
        return response

    transport = MockTransport(handler)
    client = AsyncClient(transport=transport, base_url="http://testserver")

    with pytest.raises(HTTPException) as excinfo:
        await my_profile(client, user_token)

    assert excinfo.value.status_code == 401
    assert "Not authenticated" in str(excinfo.value.detail)
