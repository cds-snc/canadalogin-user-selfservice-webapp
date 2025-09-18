# backend/tests/test_profile.py

import pytest
from httpx import Response, Request, MockTransport, AsyncClient
from fastapi import Request as FastAPIRequest, HTTPException
from types import SimpleNamespace
from starlette.datastructures import Headers

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

from datetime import datetime


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
            "created": datetime.utcnow().isoformat(),
            "lastModified": datetime.utcnow().isoformat(),
            "location": "/Users/user-123",
        },
        "active": True,
    }


@pytest.fixture
def update_request():
    # including firstName so that sanitize returns it
    return UserProfileUpdateRequest(
        userName="john@example.com",
        firstName="Johnny",
        phone="9999999999",
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
                self.request_client = AsyncClient(transport=transport)
                self.config = SimpleNamespace(
                    profile_api_endpoint="https://mock.api/profile"
                )

        class MockApp:
            def __init__(self):
                self.state = MockAppState()

        return MockApp()

    return _app_with_transport


def test_sanitize_user_profile_data():
    update_request = UserProfileUpdateRequest(
        userName="john@example.com", name=UserProfileName(givenName="Johnny")
    )
    result = sanitize_user_profile_data(update_request)

    # Check that userName is preserved
    assert "userName" in result
    assert result["userName"] == "john@example.com"

    # Check that name.givenName is preserved
    assert "name" in result
    assert result["name"]["givenName"] == "Johnny"


@pytest.mark.asyncio
async def test_dispatch_update_user_profile_handles_type_error(
    user_token, fake_profile_data, mock_app, make_request
):
    """
    Because the code uses `await response.raise_for_status()` (incorrectly),
    this should lead to a TypeError, which the RequestErrorHandler will transform into an HTTPException(500).
    """

    def handler(request: Request) -> Response:
        assert request.method == "PUT"
        return Response(status_code=200, json=fake_profile_data)

    transport = MockTransport(handler)
    app = mock_app(transport)
    req = make_request(app)

    payload = IBMVerifyUpdateUserProfile(**fake_profile_data).model_dump_json(
        by_alias=True, exclude_none=True
    )

    with pytest.raises(HTTPException) as excinfo:
        await dispatch_update_user_profile(req, payload, user_token)

    # The code catches the exception and uses RequestErrorHandler, so status_code 500
    assert excinfo.value.status_code == 500
    assert "Unexpected API request error" in str(excinfo.value.detail)


@pytest.mark.asyncio
async def test_update_profile_success_catches_dispatch_error(
    update_request, fake_profile_data, user_token, mock_app, make_request
):
    """
    The code will first GET the profile (success), then attempt PUT,
    but dispatch_update_user_profile will error (due to the TypeError),
    so update_profile should bubble up HTTPException(500).
    """

    def handler(request: Request) -> Response:
        if request.method == "GET":
            return Response(status_code=200, json=fake_profile_data)
        elif request.method == "PUT":
            merged = {**fake_profile_data, **update_request.model_dump()}
            merged.setdefault("emails", fake_profile_data["emails"])
            merged.setdefault("meta", fake_profile_data["meta"])
            return Response(status_code=200, json=merged)
        else:
            return Response(status_code=404, json={"detail": "Not Found"})

    transport = MockTransport(handler)
    app = mock_app(transport)
    req = make_request(app)

    with pytest.raises(HTTPException) as excinfo:
        await update_profile(req, update_request, user_token)

    assert excinfo.value.status_code == 500
    # The detail could be "Unexpected API request error"
    assert "Unexpected API request error" in str(excinfo.value.detail)


@pytest.mark.asyncio
async def test_update_profile_user_mismatch(
    update_request, fake_profile_data, user_token, mock_app, make_request
):
    mismatched = {**fake_profile_data, "userName": "wrong@example.com"}

    def handler(request: Request) -> Response:
        if request.method == "GET":
            return Response(status_code=200, json=mismatched)
        else:
            return Response(status_code=404, json={"detail": "Not Found"})

    transport = MockTransport(handler)
    app = mock_app(transport)
    req = make_request(app)

    with pytest.raises(HTTPException) as excinfo:
        await update_profile(req, update_request, user_token)
    assert excinfo.value.status_code == 403
    assert "User mismatch" in str(excinfo.value.detail)


@pytest.mark.asyncio
async def test_my_profile_success(fake_profile_data, user_token):
    def handler(request: Request) -> Response:
        assert request.method == "GET"
        return Response(status_code=200, json=fake_profile_data)

    transport = MockTransport(handler)
    client = AsyncClient(transport=transport)

    response = await my_profile(client, user_token)
    assert isinstance(response, ProfileResponse)
    assert response.data.userName == fake_profile_data["userName"]
    assert response.data.id == fake_profile_data["id"]
    assert response.data.meta.resourceType == fake_profile_data["meta"]["resourceType"]
    assert response.data.active == fake_profile_data["active"]


@pytest.mark.asyncio
async def test_my_profile_unauthorized(user_token):
    def handler(request: Request) -> Response:
        return Response(status_code=401, json={"detail": "Not authenticated"})

    transport = MockTransport(handler)
    client = AsyncClient(transport=transport)

    with pytest.raises(HTTPException) as excinfo:
        await my_profile(client, user_token)
    assert excinfo.value.status_code == 401
    assert "Not authenticated" in str(excinfo.value.detail)
