import pytest
import respx

from httpx import AsyncClient, Response
from fastapi import HTTPException
from pydantic import ValidationError

from app.utils.schemas import ProfilePUTData, ProfileGetResponseData, ProfileResponse
from app.users.services.profile import update_profile, my_profile


@pytest.fixture
def user_access_token():
    return "mock_access_token"


@pytest.fixture
def profile_api_endpoint():
    return "https://mock-api.test/profile"


@pytest.fixture
def profile_put_data():
    return ProfilePUTData(
        userName="test@example.com",
        preferredLanguage="en",
        phoneNumbers=[],
        name=None,
    )


@respx.mock
@pytest.mark.asyncio
async def test_update_profile_success(profile_put_data, user_access_token, profile_api_endpoint):
    mock_response_data = {
        "userName": "test@example.com",
        "preferredLanguage": "en",
        "meta": {"resourceType": "User", "created": "2024-01-01T00:00:00Z", "lastModified": "2024-01-02T00:00:00Z"},
        "active": True,
        "id": "12345",
        "emails": [],
    }

    respx.put(profile_api_endpoint).mock(
        return_value=Response(status_code=200, json=mock_response_data)
    )

    async with AsyncClient() as client:
        response = await update_profile(client, profile_put_data, user_access_token, profile_api_endpoint)

    assert isinstance(response, ProfileResponse)
    assert response.success is True
    assert response.data.userName == "test@example.com"


@respx.mock
@pytest.mark.asyncio
async def test_update_profile_failure(profile_put_data, user_access_token, profile_api_endpoint):
    error_detail = {"detail": "Invalid user data"}

    respx.put(profile_api_endpoint).mock(
        return_value=Response(status_code=400, json=error_detail)
    )

    async with AsyncClient() as client:
        with pytest.raises(HTTPException) as exc_info:
            await update_profile(client, profile_put_data, user_access_token, profile_api_endpoint)

    assert exc_info.value.status_code == 400
    assert "Invalid user data" in str(exc_info.value.detail)


@respx.mock
@pytest.mark.asyncio
async def test_my_profile_success(user_access_token, profile_api_endpoint):
    mock_response_data = {
        "userName": "test@example.com",
        "preferredLanguage": "en",
        "meta": {"resourceType": "User", "created": "2024-01-01T00:00:00Z", "lastModified": "2024-01-02T00:00:00Z"},
        "active": True,
        "id": "12345",
        "emails": [],
    }

    respx.get(profile_api_endpoint).mock(
        return_value=Response(status_code=200, json=mock_response_data)
    )

    async with AsyncClient() as client:
        response = await my_profile(client, user_access_token, profile_api_endpoint)

    assert isinstance(response, ProfileResponse)
    assert response.success is True
    assert response.data.userName == "test@example.com"


@respx.mock
@pytest.mark.asyncio
async def test_my_profile_unauthorized(user_access_token, profile_api_endpoint):
    respx.get(profile_api_endpoint).mock(
        return_value=Response(status_code=401, json={"detail": "Unauthorized"})
    )

    async with AsyncClient() as client:
        with pytest.raises(HTTPException) as exc_info:
            await my_profile(client, user_access_token, profile_api_endpoint)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Not authenticated"
