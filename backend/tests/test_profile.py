import pytest
from unittest.mock import AsyncMock, MagicMock, patch, Mock
from fastapi import HTTPException
from app.users.schemas import UserProfileUpdateRequest
from app.users.services.profile import update_profile, my_profile


@pytest.mark.asyncio
async def test_update_profile_success():
    user_data = UserProfileUpdateRequest(
        userName="test@example.com",
        preferredLanguage="en",
        name={"givenName": "John", "familyName": "Doe"},
    )

    mock_get_response = AsyncMock()
    mock_get_response.status_code = 200
    mock_get_response.json = Mock(
        return_value={
            "userName": "test@example.com",
            "id": "user123",
            "active": True,
            "emails": [{"type": "work", "value": "test@example.com"}],
            "meta": {
                "created": "2023-01-01T00:00:00Z",
                "location": "/users/user123",
                "lastModified": "2023-01-01T00:00:00Z",
                "resourceType": "User",
            },
        }
    )

    mock_put_response = AsyncMock()
    mock_put_response.status_code = 200
    mock_put_response.json = Mock(return_value=mock_get_response.json())

    mock_request = MagicMock()
    mock_request.app.state.request_client.get = AsyncMock(
        return_value=mock_get_response
    )
    mock_request.app.state.request_client.put = AsyncMock(
        return_value=mock_put_response
    )
    mock_request.app.state.config.profile_api_endpoint = "https://fake.api/user"

    with patch(
        "app.users.services.profile.get_auth_request_headers",
        return_value={"Authorization": "Bearer fake-token"},
    ):
        result = await update_profile(mock_request, user_data, "fake-token")

    assert result.success is True
    assert result.data.userName == user_data.userName


@pytest.mark.asyncio
async def test_update_profile_username_mismatch():
    user_data = UserProfileUpdateRequest(
        userName="wrong@example.com",
        preferredLanguage="en",
    )

    mock_get_response = AsyncMock()
    mock_get_response.status_code = 200
    mock_get_response.json = Mock(
        return_value={
            "userName": "original@example.com",
            "id": "user123",
            "active": True,
            "emails": [{"type": "work", "value": "original@example.com"}],
            "meta": {
                "created": "2023-01-01T00:00:00Z",
                "location": "/users/user123",
                "lastModified": "2023-01-01T00:00:00Z",
                "resourceType": "User",
            },
        }
    )

    mock_request = MagicMock()
    mock_request.app.state.request_client.get = AsyncMock(
        return_value=mock_get_response
    )
    mock_request.app.state.config.profile_api_endpoint = "https://fake.api/user"

    with patch(
        "app.users.services.profile.get_auth_request_headers",
        return_value={"Authorization": "Bearer fake-token"},
    ):
        with pytest.raises(HTTPException) as exc_info:
            await update_profile(mock_request, user_data, "fake-token")

        assert exc_info.value.status_code == 403
        assert "User mismatch" in exc_info.value.detail


@pytest.mark.asyncio
async def test_update_profile_put_fails():
    user_data = UserProfileUpdateRequest(
        userName="test@example.com",
        preferredLanguage="en",
    )

    mock_get_response = AsyncMock()
    mock_get_response.status_code = 200
    mock_get_response.json = Mock(
        return_value={
            "userName": "test@example.com",
            "id": "user123",
            "active": True,
            "emails": [{"type": "work", "value": "test@example.com"}],
            "meta": {
                "created": "2023-01-01T00:00:00Z",
                "location": "/users/user123",
                "lastModified": "2023-01-01T00:00:00Z",
                "resourceType": "User",
            },
        }
    )

    mock_put_response = AsyncMock()
    mock_put_response.status_code = 500
    mock_put_response.json = Mock(return_value={"detail": "Internal Server Error"})

    mock_request = MagicMock()
    mock_request.app.state.request_client.get = AsyncMock(
        return_value=mock_get_response
    )
    mock_request.app.state.request_client.put = AsyncMock(
        return_value=mock_put_response
    )
    mock_request.app.state.config.profile_api_endpoint = "https://fake.api/user"

    with patch(
        "app.users.services.profile.get_auth_request_headers",
        return_value={"Authorization": "Bearer fake-token"},
    ):
        with pytest.raises(HTTPException) as exc_info:
            await update_profile(mock_request, user_data, "fake-token")

        assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_my_profile_success():
    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.json = Mock(
        return_value={
            "userName": "test@example.com",
            "id": "user123",
            "active": True,
            "emails": [{"type": "work", "value": "test@example.com"}],
            "meta": {
                "created": "2023-01-01T00:00:00Z",
                "location": "/users/user123",
                "lastModified": "2023-01-01T00:00:00Z",
                "resourceType": "User",
            },
        }
    )

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)

    with (
        patch(
            "app.users.services.profile.get_auth_request_headers",
            return_value={"Authorization": "Bearer fake-token"},
        ),
        patch("app.users.services.profile.get_configuration") as mock_config,
    ):
        mock_config.return_value.profile_api_endpoint = "https://fake.api/user"

        result = await my_profile(mock_client, "fake-token")

    assert result.success is True
    assert result.data.userName == "test@example.com"


@pytest.mark.asyncio
async def test_my_profile_other_failure():
    mock_response = AsyncMock()
    mock_response.status_code = 500
    mock_response.json = Mock(return_value={"detail": "Server error"})
    mock_response.text = "Server error"

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)

    with (
        patch(
            "app.users.services.profile.get_auth_request_headers",
            return_value={"Authorization": "Bearer fake-token"},
        ),
        patch("app.users.services.profile.get_configuration") as mock_config,
    ):
        mock_config.return_value.profile_api_endpoint = "https://fake.api/user"

        with pytest.raises(HTTPException) as exc_info:
            await my_profile(mock_client, "fake-token")

        assert exc_info.value.status_code == 500
