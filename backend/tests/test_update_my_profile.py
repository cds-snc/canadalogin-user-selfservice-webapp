import pytest
import respx
from httpx import AsyncClient, Response
from unittest.mock import AsyncMock, Mock, patch
from app.utils.request_error_handler import RequestErrorHandler

from app.users.services.update_my_profile import (
    update_my_profile as update_profile,
    dispatch_update_my_profile as dispatch_update_user_profile,
    sanitize_user_profile_data,
)

from app.users.schemas import (
    IBMVerifyUpdateUserProfile,
    IBMVerifyUserProfileSchema,
    UserProfileUpdateRequest,
    UserProfileName,
)
from app.config import get_configuration
from fastapi import HTTPException


PROFILE_API_URL = "https://fake-tenant.verify.ibm.com/v2.0/Me"
SANITIZE_PROFILE_IMPORT_PATH = (
    "app.users.services.update_my_profile.sanitize_user_profile_data"
)
MY_PROFILE_IMPORT_PATH = "app.users.services.get_my_profile.get_my_profile"
DISPATCH_UPDATE_PROFILE_IMPORT_PATH = (
    "app.users.services.update_my_profile.dispatch_update_my_profile"
)
CONFIGURATION_IMPORT_PATH = "app.users.services.get_my_profile.get_configuration"
MASK_PHONE_IMPORT_PATH = (
    "app.users.services.update_my_profile.mask_contact_phone_numbers"
)
DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH = (
    "app.users.services.update_my_profile.dispatch_get_my_profile_from_ibm"
)


@pytest.mark.asyncio
@patch(MASK_PHONE_IMPORT_PATH)
@patch(DISPATCH_UPDATE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
@patch(SANITIZE_PROFILE_IMPORT_PATH)
async def test_update_profile_success(
    mock_sanitize, mock_dispatch_get, mock_dispatch_update, mock_mask
):
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

    # Mock dispatch_get_my_profile_from_ibm to return IBMVerifyUserProfileSchema
    mock_profile = IBMVerifyUserProfileSchema(**profile_data)
    mock_dispatch_get.return_value = mock_profile
    mock_mask.return_value = []

    # Mock dispatch_update_user_profile response
    mock_response = Mock()
    mock_response.json.return_value = profile_data
    mock_dispatch_update.return_value = mock_response

    user_data = UserProfileUpdateRequest(
        userName="john.doe@example.com", preferredLanguage="en"
    )
    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = AsyncClient()
    mock_request.app.state.config = Mock()
    mock_request.app.state.config.profile_api_endpoint = PROFILE_API_URL

    # Act
    response = await update_profile(mock_request, user_data, user_access_token="token")

    # Assert
    assert response.success is True
    assert response.message == "User profile updated successfully."
    assert mock_dispatch_get.call_args[0][1] == "token"

    mock_sanitize.assert_called_once()
    mock_dispatch_get.assert_called_once()
    mock_dispatch_update.assert_called_once()


@pytest.mark.asyncio
@patch(SANITIZE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
async def test_update_profile_user_mismatch(mock_dispatch_get, mock_sanitize):
    mock_sanitize.return_value = {"userName": "other@example.com"}

    profile_data = {"userName": "john.doe@example.com"}

    class DummyData:
        def model_dump(self):
            return profile_data

    mock_dispatch_get.return_value = Mock(data=DummyData())

    user_data = UserProfileUpdateRequest(userName="other@example.com")
    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = AsyncClient()
    mock_request.app.state.config = Mock()
    mock_request.app.state.config.profile_api_endpoint = PROFILE_API_URL

    with pytest.raises(HTTPException) as exc:
        await update_profile(mock_request, user_data, user_access_token="token")
    assert exc.value.status_code == 403
    assert mock_dispatch_get.call_args[0][1] == "token"


@pytest.mark.asyncio
@patch(MASK_PHONE_IMPORT_PATH)
@patch(DISPATCH_UPDATE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
@patch(SANITIZE_PROFILE_IMPORT_PATH)
async def test_update_profile_dispatch_failure(
    mock_sanitize, mock_dispatch_get, mock_dispatch_update, mock_mask
):
    # Arrange
    mock_sanitize.return_value = {"userName": "john.doe@example.com"}

    profile_data = {
        "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
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
    }

    # Mock dispatch_get_my_profile_from_ibm to return IBMVerifyUserProfileSchema
    mock_profile = IBMVerifyUserProfileSchema(**profile_data)
    mock_dispatch_get.return_value = mock_profile

    # Mock dispatch_update_user_profile to raise HTTPException
    mock_dispatch_update.side_effect = HTTPException(
        status_code=400, detail="Invalid request"
    )
    mock_mask.return_value = []

    user_data = UserProfileUpdateRequest(userName="john.doe@example.com")

    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = AsyncClient()
    mock_request.app.state.config = Mock()
    mock_request.app.state.config.profile_api_endpoint = PROFILE_API_URL

    # Act & Assert
    with pytest.raises(HTTPException) as exc:
        await update_profile(mock_request, user_data, user_access_token="token")

    assert exc.value.status_code == 400
    mock_dispatch_get.assert_called_once()
    mock_dispatch_update.assert_called_once()


@pytest.mark.asyncio
@patch(SANITIZE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
async def test_update_profile_validation_error(mock_dispatch_get, mock_sanitize):
    # Pass something that will cause validation error when merging
    mock_sanitize.return_value = {"userName": "john.doe@example.com", "id": 123}

    # Mock IBM profile with mismatched types
    mock_dispatch_get.return_value = Mock(
        model_dump=Mock(
            return_value={
                "userName": "john.doe@example.com",
                "id": "string-instead-of-int",
            }
        )
    )

    user_data = UserProfileUpdateRequest(userName="john.doe@example.com")
    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()

    # Act & Assert
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
    mock_request.app.state.request_client.put.return_value.raise_for_status = Mock()

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
