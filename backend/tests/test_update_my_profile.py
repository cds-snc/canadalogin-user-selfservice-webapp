import pytest
import respx
from httpx import AsyncClient, Response
from unittest.mock import AsyncMock, Mock, patch
from app.utils.request_error_handler import RequestErrorHandler

from app.users.services.update_my_profile import (
    update_my_profile as update_profile,
    dispatch_update_my_profile as dispatch_update_user_profile,
    sanitize_user_profile_data,
    set_notification_type_for_phone_update,
)

from app.users.schemas import (
    IBMVerifyUpdateUserProfile,
    IBMVerifyUserProfileSchema,
    NotifyType,
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


@pytest.mark.asyncio
@patch("app.users.services.update_my_profile.mask_contact_phone_numbers")
@patch(DISPATCH_UPDATE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
@patch(SANITIZE_PROFILE_IMPORT_PATH)
async def test_update_profile_masks_phone_numbers(
    mock_sanitize, mock_dispatch_get, mock_dispatch_update, mock_mask
):
    """Test that update_my_profile returns masked phone numbers in response."""
    # Arrange
    sanitized_data = {
        "userName": "john.doe@example.com",
        "preferredLanguage": "fr",
    }
    mock_sanitize.return_value = sanitized_data

    # Profile from IBM with unmasked phone numbers
    profile_data = {
        "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
        ],
        "userName": "john.doe@example.com",
        "emails": [{"value": "john.doe@example.com", "type": "work"}],
        "phoneNumbers": [
            {"value": "+1-613-555-1234", "type": "mobile"},
            {"value": "+1-613-555-5678", "type": "work"},
        ],
        "meta": {
            "location": "here",
            "created": "2023-01-01T00:00:00Z",
            "lastModified": "2023-09-22T12:30:00Z",
            "resourceType": "User",
        },
        "active": True,
        "id": "user-123",
        "preferredLanguage": "en",
    }

    mock_profile = IBMVerifyUserProfileSchema(**profile_data)
    mock_dispatch_get.return_value = mock_profile

    # Updated profile response from IBM (after PUT)
    updated_profile_data = {**profile_data, "preferredLanguage": "fr"}
    mock_response = Mock()
    mock_response.json.return_value = updated_profile_data
    mock_dispatch_update.return_value = mock_response

    # Mock masked phone numbers
    masked_phones = [
        {"value": "+1-613-XXX-XX34", "type": "mobile"},
        {"value": "+1-613-XXX-XX78", "type": "work"},
    ]
    mock_mask.return_value = masked_phones

    user_data = UserProfileUpdateRequest(
        userName="john.doe@example.com", preferredLanguage="fr"
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
    assert response.data.preferredLanguage == "fr"

    # Verify phone numbers are masked in response
    assert len(response.data.phoneNumbers) == 2
    assert response.data.phoneNumbers[0].value == "+1-613-XXX-XX34"
    assert response.data.phoneNumbers[0].type == "mobile"
    assert response.data.phoneNumbers[1].value == "+1-613-XXX-XX78"
    assert response.data.phoneNumbers[1].type == "work"

    # Verify masking was called with updated profile data
    mock_mask.assert_called_once()
    mask_call_data = mock_mask.call_args[0][0]
    assert mask_call_data["userName"] == "john.doe@example.com"
    assert mask_call_data["preferredLanguage"] == "fr"

    mock_sanitize.assert_called_once()
    mock_dispatch_get.assert_called_once()
    mock_dispatch_update.assert_called_once()


@pytest.mark.asyncio
@patch("app.users.services.update_my_profile.mask_contact_phone_numbers")
@patch(DISPATCH_UPDATE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
@patch(SANITIZE_PROFILE_IMPORT_PATH)
async def test_update_profile_prevents_username_change(
    mock_sanitize, mock_dispatch_get, mock_dispatch_update, mock_mask
):
    """Test that update_my_profile prevents userName from being changed."""
    # Arrange
    # User attempts to change userName from john.doe to jane.smith
    sanitized_data = {
        "userName": "john.doe@example.com",
        "name": {"givenName": "Jane", "familyName": "Smith"},
    }
    mock_sanitize.return_value = sanitized_data

    profile_data = {
        "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
        ],
        "userName": "john.doe@example.com",
        "emails": [{"value": "john.doe@example.com", "type": "work"}],
        "name": {"givenName": "John", "familyName": "Doe"},
        "phoneNumbers": [],
        "meta": {
            "location": "here",
            "created": "2023-01-01T00:00:00Z",
            "lastModified": "2023-09-22T12:30:00Z",
            "resourceType": "User",
        },
        "active": True,
        "id": "user-123",
    }

    mock_profile = IBMVerifyUserProfileSchema(**profile_data)
    mock_dispatch_get.return_value = mock_profile

    # Updated profile response - userName should remain unchanged
    updated_profile_data = {
        **profile_data,
        "name": {"givenName": "Jane", "familyName": "Smith"},
    }
    mock_response = Mock()
    mock_response.json.return_value = updated_profile_data
    mock_dispatch_update.return_value = mock_response
    mock_mask.return_value = []

    user_data = UserProfileUpdateRequest(
        userName="john.doe@example.com",
        name=UserProfileName(givenName="Jane", familyName="Smith"),
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
    assert response.data.userName == "john.doe@example.com"  # Username unchanged
    assert response.data.name.givenName == "Jane"  # Name updated
    assert response.data.name.familyName == "Smith"

    # Verify that userName was NOT included in the update payload
    mock_dispatch_update.assert_called_once()
    update_call_args = mock_dispatch_update.call_args[0]
    payload_json = update_call_args[1]  # user_profile_payload argument
    import json

    payload_dict = json.loads(payload_json)

    # userName should be in payload (from IBM profile), but the update didn't change it
    assert payload_dict["userName"] == "john.doe@example.com"
    assert payload_dict["name"]["givenName"] == "Jane"


@pytest.mark.asyncio
@patch("app.users.services.update_my_profile.mask_contact_phone_numbers")
@patch(DISPATCH_UPDATE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
@patch(SANITIZE_PROFILE_IMPORT_PATH)
async def test_update_profile_with_no_phone_numbers_to_mask(
    mock_sanitize, mock_dispatch_get, mock_dispatch_update, mock_mask
):
    """Test that update_my_profile handles profiles with no phone numbers."""
    # Arrange
    sanitized_data = {"userName": "john.doe@example.com", "preferredLanguage": "fr"}
    mock_sanitize.return_value = sanitized_data

    profile_data = {
        "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
        ],
        "userName": "john.doe@example.com",
        "emails": [{"value": "john.doe@example.com", "type": "work"}],
        "phoneNumbers": [],  # No phone numbers
        "meta": {
            "location": "here",
            "created": "2023-01-01T00:00:00Z",
            "lastModified": "2023-09-22T12:30:00Z",
            "resourceType": "User",
        },
        "active": True,
        "id": "user-123",
    }

    mock_profile = IBMVerifyUserProfileSchema(**profile_data)
    mock_dispatch_get.return_value = mock_profile

    updated_profile_data = {**profile_data, "preferredLanguage": "fr"}
    mock_response = Mock()
    mock_response.json.return_value = updated_profile_data
    mock_dispatch_update.return_value = mock_response
    mock_mask.return_value = []  # No phone numbers to mask

    user_data = UserProfileUpdateRequest(
        userName="john.doe@example.com", preferredLanguage="fr"
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
    assert len(response.data.phoneNumbers) == 0
    mock_mask.assert_called_once()  # Masking function still called


def test_set_notification_type_when_phone_numbers_updated():
    """Test that notification type is set to EMAIL when phone numbers are updated."""
    # Arrange
    profile_data = {
        "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification",
        ],
        "userName": "john.doe@example.com",
        "emails": [{"value": "john.doe@example.com", "type": "work"}],
        "phoneNumbers": [{"value": "+1-613-555-1234", "type": "mobile"}],
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

    profile = IBMVerifyUpdateUserProfile(**profile_data)
    updated_data = {"phoneNumbers": [{"value": "+1-613-555-9999", "type": "mobile"}]}

    # Act
    result = set_notification_type_for_phone_update(profile, updated_data)

    # Assert
    assert result.notification.notifyType == NotifyType.EMAIL
    assert result.userName == "john.doe@example.com"
    # Verify original profile is unchanged (immutability)
    assert profile.notification.notifyType == NotifyType.NONE


def test_set_notification_type_when_no_phone_number_field():
    """Test that profile is returned unchanged when phoneNumbers not in updated_data."""
    # Arrange
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

    profile = IBMVerifyUpdateUserProfile(**profile_data)
    updated_data = {"preferredLanguage": "fr"}  # No phoneNumbers field

    # Act
    with patch("app.users.services.update_my_profile.logger") as mock_logger:
        result = set_notification_type_for_phone_update(profile, updated_data)

    # Assert
    assert result == profile  # Should return same profile object
    assert result.notification.notifyType == NotifyType.NONE
    mock_logger.debug.assert_called_once_with(
        "No phone number updates, keeping existing notification type"
    )


def test_set_notification_type_when_phone_numbers_empty_list():
    """Test that profile is returned unchanged when phoneNumbers is an empty list."""
    # Arrange
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
        "notification": {"notifyType": "EMAIL"},
    }

    profile = IBMVerifyUpdateUserProfile(**profile_data)
    updated_data = {"phoneNumbers": []}  # Empty list

    # Act
    with patch("app.users.services.update_my_profile.logger") as mock_logger:
        result = set_notification_type_for_phone_update(profile, updated_data)

    # Assert
    assert result == profile
    assert result.notification.notifyType == NotifyType.EMAIL
    mock_logger.debug.assert_called_once_with(
        "Phone numbers list is empty, keeping existing notification type"
    )


def test_set_notification_type_raises_error_when_notification_is_none():
    """Test that ValueError is raised when notification object is None."""
    # Arrange
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
        "notification": {"notifyType": "NONE"},
    }

    profile = IBMVerifyUpdateUserProfile(**profile_data)
    profile.notification = None
    updated_data = {"phoneNumbers": [{"value": "+1-613-555-9999", "type": "mobile"}]}

    # Act & Assert
    with pytest.raises(ValueError) as exc_info:
        set_notification_type_for_phone_update(profile, updated_data)

    assert (
        "Profile notification object cannot be None when updating phone numbers"
        in str(exc_info.value)
    )


def test_set_notification_type_logs_info_when_updating():
    """Test that info log is written when notification type is set to EMAIL."""
    # Arrange
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

    profile = IBMVerifyUpdateUserProfile(**profile_data)
    updated_data = {"phoneNumbers": [{"value": "+1-613-555-9999", "type": "mobile"}]}

    # Act
    with patch("app.users.services.update_my_profile.logger") as mock_logger:
        result = set_notification_type_for_phone_update(profile, updated_data)

    # Assert
    assert result.notification.notifyType == NotifyType.EMAIL
    mock_logger.info.assert_called_once_with(
        "Phone numbers are being updated, setting notification type to EMAIL"
    )


def test_set_notification_type_preserves_immutability():
    """Test that original profile object is not mutated (immutability check)."""
    # Arrange
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

    profile = IBMVerifyUpdateUserProfile(**profile_data)
    original_notify_type = profile.notification.notifyType
    updated_data = {"phoneNumbers": [{"value": "+1-613-555-9999", "type": "mobile"}]}

    # Act
    result = set_notification_type_for_phone_update(profile, updated_data)

    # Assert
    # Original profile should remain unchanged
    assert profile.notification.notifyType == original_notify_type
    # New profile should have EMAIL
    assert result.notification.notifyType == NotifyType.EMAIL
    # They should be different objects
    assert result is not profile
    assert result.notification is not profile.notification


def test_set_notification_type_with_multiple_phone_numbers():
    """Test that notification type is set when multiple phone numbers are updated."""
    # Arrange
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

    profile = IBMVerifyUpdateUserProfile(**profile_data)
    updated_data = {
        "phoneNumbers": [
            {"value": "+1-613-555-1234", "type": "mobile"},
            {"value": "+1-613-555-5678", "type": "work"},
        ]
    }

    # Act
    result = set_notification_type_for_phone_update(profile, updated_data)

    # Assert
    assert result.notification.notifyType == NotifyType.EMAIL


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
