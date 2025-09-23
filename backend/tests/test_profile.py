from app.users.services.profile import update_profile
from unittest.mock import AsyncMock, Mock, patch
from app.utils.request_error_handler import RequestErrorHandler
import pytest
import respx
from httpx import AsyncClient, Response
from app.users.services.profile import (
    dispatch_update_user_profile,
    sanitize_user_profile_data,
    my_profile,
)
from app.users.schemas import (
    IBMVerifyUpdateUserProfile,
    UserProfileUpdateRequest,
    UserProfileName,
)
from app.config import get_configuration
from fastapi import HTTPException


PROFILE_API_URL = "https://fake-tenant.verify.ibm.com/v2.0/Me"


@pytest.mark.asyncio
@patch("app.users.services.profile.my_profile")
@patch("app.users.services.profile.sanitize_user_profile_data")
async def test_update_profile_unexpected_exception(mock_sanitize, mock_my_profile):
    mock_sanitize.return_value = {"userName": "john.doe@example.com"}

    # Simulate unexpected error in my_profile function
    mock_my_profile.side_effect = Exception("Unexpected failure")

    user_data = UserProfileUpdateRequest(userName="john.doe@example.com")
    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()

    with pytest.raises(Exception) as exc:
        await update_profile(mock_request, user_data, user_access_token="token")

    assert str(exc.value) == "Unexpected failure"


@pytest.mark.asyncio
@patch("app.users.services.profile.sanitize_user_profile_data")
@patch("app.users.services.profile.my_profile")
@patch("app.users.services.profile.dispatch_update_user_profile")
async def test_update_profile_success(mock_dispatch, mock_my_profile, mock_sanitize):
    # Arrange
    sanitized_data = {"userName": "john.doe@example.com", "preferredLanguage": "en"}
    mock_sanitize.return_value = sanitized_data

    profile_data = {
        "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification",
        ],
        "userName": "john.doe@example.com",
        "emails": [{"value": "john.doe@example.com", "type": "work"}],
        "meta": {
            "location": "here",
            "created": "2023-01-01T00:00:00Z",
            "lastModified": "2023-09-22T12:30:00Z",
            "resourceType": "User",
        },
        "active": True,
        "id": "user-123",
        "notification": {"notifyType": "NONE"},
    }

    class DummyData:
        def model_dump(self):
            return profile_data

    mock_my_profile.return_value = Mock(data=DummyData())

    mock_response = Mock()
    mock_response.status_code = 200
    mock_response.json.return_value = profile_data
    mock_dispatch.return_value = mock_response

    user_data = UserProfileUpdateRequest(
        userName="john.doe@example.com", preferredLanguage="en"
    )
    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()

    # Act
    response = await update_profile(mock_request, user_data, user_access_token="token")

    # Assert
    assert response.success is True
    assert response.message == "User profile updated successfully."
    mock_sanitize.assert_called_once()
    mock_my_profile.assert_called_once()
    mock_dispatch.assert_called_once()


@pytest.mark.asyncio
@patch("app.users.services.profile.sanitize_user_profile_data")
@patch("app.users.services.profile.my_profile")
async def test_update_profile_user_mismatch(mock_my_profile, mock_sanitize):
    mock_sanitize.return_value = {"userName": "other@example.com"}

    profile_data = {"userName": "john.doe@example.com"}

    class DummyData:
        def model_dump(self):
            return profile_data

    mock_my_profile.return_value = Mock(data=DummyData())

    user_data = UserProfileUpdateRequest(userName="other@example.com")
    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()

    with pytest.raises(HTTPException) as exc:
        await update_profile(mock_request, user_data, user_access_token="token")
    assert exc.value.status_code == 403


@pytest.mark.asyncio
@patch("app.users.services.profile.sanitize_user_profile_data")
@patch("app.users.services.profile.my_profile")
@patch("app.users.services.profile.dispatch_update_user_profile")
async def test_update_profile_dispatch_failure(
    mock_dispatch, mock_my_profile, mock_sanitize
):
    mock_sanitize.return_value = {"userName": "john.doe@example.com"}

    profile_data = {
        "userName": "john.doe@example.com",
        "emails": [{"value": "john.doe@example.com", "type": "work"}],
        "meta": {
            "location": "here",
            "created": "2023-01-01T00:00:00Z",
            "lastModified": "2023-09-22T12:30:00Z",
            "resourceType": "User",
        },
        "active": True,
        "id": "user-123",
    }

    class DummyData:
        def model_dump(self):
            return profile_data

    mock_my_profile.return_value = Mock(data=DummyData())

    mock_response = Mock()
    mock_response.status_code = 400
    mock_response.json.return_value = {"detail": "Invalid request"}
    mock_dispatch.return_value = mock_response

    user_data = UserProfileUpdateRequest(userName="john.doe@example.com")
    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()

    with pytest.raises(HTTPException) as exc:
        await update_profile(mock_request, user_data, user_access_token="token")

    assert exc.value.status_code == 400


@pytest.mark.asyncio
@patch("app.users.services.profile.sanitize_user_profile_data")
async def test_update_profile_validation_error(mock_sanitize):
    # Pass something that will cause validation error when merging
    mock_sanitize.return_value = {"userName": "john.doe@example.com", "id": 123}

    user_data = UserProfileUpdateRequest(userName="john.doe@example.com")
    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()

    # Patch my_profile to return a profile with mismatching types to cause validation error
    with patch(
        "app.users.services.profile.my_profile",
        new=AsyncMock(
            return_value=Mock(
                data=Mock(
                    model_dump=Mock(
                        return_value={
                            "userName": "john.doe@example.com",
                            "id": "string-instead-of-int",
                        }
                    )
                )
            )
        ),
    ):
        with pytest.raises(HTTPException) as exc:
            await update_profile(mock_request, user_data, user_access_token="token")
        assert exc.value.status_code == 422


@pytest.mark.asyncio
@respx.mock
async def test_dispatch_update_user_profile_success():
    respx.put(PROFILE_API_URL).mock(
        return_value=Response(status_code=200, json={"success": True})
    )

    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = AsyncClient()
    mock_request.app.state.config = get_configuration()

    payload = IBMVerifyUpdateUserProfile(
        **{
            "schemas": [
                "urn:ietf:params:scim:schemas:core:2.0:User",
                "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
                "urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification",
            ],
            "userName": "john.doe@example.com",
            "emails": [{"value": "john.doe@example.com", "type": "work"}],
            "meta": {
                "location": "here",
                "created": "2023-01-01T00:00:00Z",
                "lastModified": "2023-09-22T12:30:00Z",
                "resourceType": "User",
            },
            "active": True,
            "id": "user-123",
            "notification": {"notifyType": "NONE"},
        }
    )

    # Patch raise_for_status to an async no-op to avoid TypeError
    mock_request.app.state.request_client.put = AsyncMock(
        return_value=Response(status_code=200, json={"success": True})
    )
    mock_request.app.state.request_client.put.return_value.raise_for_status = (
        AsyncMock()
    )

    response = await dispatch_update_user_profile(
        request=mock_request,
        user_profile_payload=payload.model_dump_json(by_alias=True),
        user_access_token="mock-token",
    )
    assert response.status_code == 200


@pytest.mark.asyncio
@respx.mock
async def test_dispatch_update_user_profile_failure(monkeypatch):
    respx.put(PROFILE_API_URL).mock(
        return_value=Response(
            status_code=400,
            json={"detail": "Invalid request"},
        )
    )

    # Patch error handler to prevent crashing the test
    monkeypatch.setattr(
        RequestErrorHandler, "handle", lambda e: (_ for _ in ()).throw(e)
    )

    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = AsyncClient()
    mock_request.app.state.config = get_configuration()

    payload = IBMVerifyUpdateUserProfile(
        **{
            "schemas": [
                "urn:ietf:params:scim:schemas:core:2.0:User",
                "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
                "urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification",
            ],
            "userName": "john.doe@example.com",
            "emails": [{"value": "john.doe@example.com", "type": "work"}],
            "meta": {
                "location": "here",
                "created": "2023-01-01T00:00:00Z",
                "lastModified": "2023-09-22T12:30:00Z",
                "resourceType": "User",
            },
            "active": True,
            "id": "user-123",
            "notification": {"notifyType": "NONE"},
        }
    )

    with pytest.raises(Exception):
        await dispatch_update_user_profile(
            request=mock_request,
            user_profile_payload=payload.model_dump_json(by_alias=True),
            user_access_token="mock-token",
        )


@pytest.mark.asyncio
@respx.mock
async def test_my_profile_success(monkeypatch):
    test_url = "https://mocked-api.ibm.com/v2.0/Me"

    # Patch the config used inside the my_profile function
    monkeypatch.setattr(
        "app.users.services.profile.get_configuration",
        lambda: Mock(profile_api_endpoint=test_url),
    )

    respx.get(test_url).mock(
        return_value=Response(
            status_code=200,
            json={
                "userName": "john.doe@example.com",
                "emails": [{"value": "john.doe@example.com", "type": "work"}],
                "meta": {
                    "location": "here",
                    "created": "2023-01-01T00:00:00Z",
                    "lastModified": "2023-09-22T12:30:00Z",
                    "resourceType": "User",
                },
                "active": True,
                "id": "user-123",
                "notification": {"notifyType": "NONE"},
            },
        )
    )

    http_client = AsyncClient()
    response = await my_profile(http_client, user_access_token="mock-token")

    assert response.success is True
    assert response.data.userName == "john.doe@example.com"


@pytest.mark.asyncio
@respx.mock
async def test_my_profile_unauthorized(monkeypatch):
    test_url = "https://mocked-api.ibm.com/v2.0/Me"

    monkeypatch.setattr(
        "app.users.services.profile.get_configuration",
        lambda: Mock(profile_api_endpoint=test_url),
    )

    respx.get(test_url).mock(return_value=Response(status_code=401))

    http_client = AsyncClient()

    with pytest.raises(HTTPException) as exc:
        await my_profile(http_client, user_access_token="mock-token")

    assert exc.value.status_code == 401
    assert "Not authenticated" in str(exc.value.detail)


@pytest.mark.asyncio
@respx.mock
async def test_my_profile_other_error(monkeypatch):
    test_url = "https://mocked-api.ibm.com/v2.0/Me"

    monkeypatch.setattr(
        "app.users.services.profile.get_configuration",
        lambda: Mock(profile_api_endpoint=test_url),
    )

    respx.get(test_url).mock(
        return_value=Response(
            status_code=500,
            json={"detail": "Internal Server Error"},
        )
    )

    http_client = AsyncClient()

    with pytest.raises(HTTPException) as exc:
        await my_profile(http_client, user_access_token="mock-token")

    assert exc.value.status_code == 500
    assert "HTTP error" in str(exc.value.detail)


def test_sanitize_user_profile_data():
    input_data = UserProfileUpdateRequest(
        userName="john.doe@example.com",
        name=UserProfileName(givenName="Johnny", familyName=None, formatted=None),
        preferredLanguage=None,
        phoneNumbers=None,
    )
    result = sanitize_user_profile_data(input_data)
    assert result["userName"] == "john.doe@example.com"
    assert "preferredLanguage" not in result
    assert "phoneNumbers" not in result
