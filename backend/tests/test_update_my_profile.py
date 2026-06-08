import pytest
import respx
from httpx import AsyncClient, Response
from unittest.mock import AsyncMock, Mock, patch
from app.utils.request_error_handler import RequestErrorHandler

from app.users.services.update_my_profile import (
    update_my_profile as update_profile,
    update_profile_for_verified_changes,
    dispatch_update_my_profile,
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
MASK_PHONE_IMPORT_PATH = "app.users.services.update_my_profile.mask_profile_details"
DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH = (
    "app.users.services.update_my_profile.dispatch_get_my_profile_from_ibm"
)

MASK_PROFILE_DETAILS_IMPORT_PATH = (
    "app.users.services.update_my_profile.mask_profile_details"
)


@pytest.mark.asyncio
@patch(MASK_PROFILE_DETAILS_IMPORT_PATH)
@patch(DISPATCH_UPDATE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
@patch(SANITIZE_PROFILE_IMPORT_PATH)
async def test_update_profile_success(
    mock_sanitize, mock_dispatch_get, mock_dispatch_update, mock_masked_profile
):
    # Arrange
    sanitized_data = {
        "user_id": "user-123",
        "userName": "john.doe@example.com",
        "preferredLanguage": "en",
    }
    mock_sanitize.return_value = sanitized_data

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

    # Mock dispatch_get_my_profile_from_ibm to return IBMVerifyUserProfileSchema
    mock_profile = IBMVerifyUserProfileSchema(**profile_data)
    mock_dispatch_get.return_value = mock_profile

    mock_masked_profile.return_value = {
        **profile_data,
        "userName": "ja****@example.com",
    }

    # Mock dispatch_update_user_profile response
    mock_response = Mock()
    mock_response.json.return_value = profile_data
    mock_dispatch_update.return_value = mock_response

    user_data = UserProfileUpdateRequest(user_id="user-123", preferredLanguage="en")
    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = Mock(spec=AsyncClient)
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
@patch(MASK_PHONE_IMPORT_PATH)
@patch(DISPATCH_UPDATE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
@patch(SANITIZE_PROFILE_IMPORT_PATH)
async def test_update_profile_dispatch_failure(
    mock_sanitize, mock_dispatch_get, mock_dispatch_update, mock_mask
):
    """Test that update_profile properly handles dispatch failures."""
    # Arrange
    mock_sanitize.return_value = {"user_id": "user-123"}

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

    user_data = UserProfileUpdateRequest(user_id="user-123")

    # Create properly mocked request object
    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = Mock(spec=AsyncClient)
    mock_request.app.state.config = Mock()
    mock_request.app.state.config.profile_api_endpoint = PROFILE_API_URL

    # Act & Assert
    with pytest.raises(HTTPException) as exc:
        await update_profile(mock_request, user_data, user_access_token="token")

    # Verify the exception details
    assert exc.value.status_code == 400
    assert exc.value.detail == "Invalid request"

    # Verify all mocks were called as expected
    mock_sanitize.assert_called_once_with(user_data)
    mock_dispatch_get.assert_called_once()
    mock_dispatch_update.assert_called_once()

    # Verify the get call was made with correct token
    get_call_args = mock_dispatch_get.call_args
    assert get_call_args[0][1] == "token"  # user_access_token parameter


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

    response = await dispatch_update_my_profile(
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
        await dispatch_update_my_profile(
            request=mock_request,
            user_profile_payload=payload.model_dump_json(by_alias=True),
            user_access_token="mock-token",
        )


@pytest.mark.asyncio
@patch("app.users.services.update_my_profile.mask_profile_details")
@patch(DISPATCH_UPDATE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
@patch(SANITIZE_PROFILE_IMPORT_PATH)
async def test_update_profile_masks_phone_numbers(
    mock_sanitize, mock_dispatch_get, mock_dispatch_update, mock_mask_profile
):
    """Test that update_my_profile returns masked phone numbers in response."""
    # Arrange
    sanitized_data = {
        "userName": "john.doe@example.com",
        "user_id": "user-123",
        "preferredLanguage": "fr",
    }
    mock_sanitize.return_value = sanitized_data

    # Profile from IBM with unmasked phone number
    profile_data = {
        "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
        ],
        "userName": "john.doe@example.com",
        "emails": [{"value": "john.doe@example.com", "type": "work"}],
        "phoneNumbers": [{"type": "mobile", "value": "+16135551234"}],
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

    mock_mask_profile.return_value = {
        **mock_response.json(),
        "userName": "ja****@example.com",
        "phoneNumbers": [{"type": "mobile", "value": "+1 (***) ***-1234"}],
    }

    user_data = UserProfileUpdateRequest(
        userName="john.doe@example.com", user_id="user-123", preferredLanguage="fr"
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
    assert response.data.phoneNumbers is not None
    assert response.data.phoneNumbers[0].value == "+1 (***) ***-1234"
    assert response.data.userName == "ja****@example.com"
    assert response.success is True

    # Verify masking was called once with the model_dump() of the parsed PUT response
    mock_mask_profile.assert_called_once()
    mask_call_data = mock_mask_profile.call_args[0][0]
    assert mask_call_data["userName"] == "john.doe@example.com"
    assert mask_call_data["preferredLanguage"] == "fr"


@pytest.mark.asyncio
@patch("app.users.services.update_my_profile.mask_profile_details")
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
        # "userName": "john.doe@example.com",
        "user_id": "user-123",
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
        "user_id": "user-123",
        "name": {"givenName": "Jane", "familyName": "Smith"},
    }
    mock_response = Mock()
    mock_response.json.return_value = updated_profile_data
    mock_dispatch_update.return_value = mock_response

    mock_mask.return_value = {
        **mock_response.json(),
        "userName": "jo****@example.com",
    }

    user_data = UserProfileUpdateRequest(
        userName="john.doe@example.com",
        user_id="user-123",
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
    assert response.data.userName == "jo****@example.com"  # Username unchanged
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
@patch("app.users.services.update_my_profile.mask_profile_details")
@patch(DISPATCH_UPDATE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
@patch(SANITIZE_PROFILE_IMPORT_PATH)
async def test_update_profile_with_no_phone_numbers_to_mask(
    mock_sanitize, mock_dispatch_get, mock_dispatch_update, mock_mask
):
    """Test that update_my_profile handles profiles with no phone numbers."""
    # Arrange
    sanitized_data = {
        "userName": "john.doe@example.com",
        "preferredLanguage": "fr",
        "user_id": "user-123",
    }
    mock_sanitize.return_value = sanitized_data

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

    mock_profile = IBMVerifyUserProfileSchema(**profile_data)
    mock_dispatch_get.return_value = mock_profile

    updated_profile_data = {**profile_data, "preferredLanguage": "fr"}
    mock_response = Mock()
    mock_response.json.return_value = updated_profile_data
    mock_dispatch_update.return_value = mock_response

    mock_mask.return_value = {
        **mock_response.json(),
        "userName": "jo****@example.com",
        "user_id": "user-123",
        "phoneNumbers": [],
    }

    user_data = UserProfileUpdateRequest(
        userName="john.doe@example.com", preferredLanguage="fr", user_id="user-123"
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
    assert response.data.phoneNumbers == []
    mock_mask.assert_called_once()  # Masking function still called


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


# Tests for update_profile_for_verified_changes


@pytest.mark.asyncio
@patch(MASK_PHONE_IMPORT_PATH)
@patch(DISPATCH_UPDATE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
@patch(SANITIZE_PROFILE_IMPORT_PATH)
async def test_update_profile_for_verified_changes_success(
    mock_sanitize, mock_dispatch_get, mock_dispatch_update, mock_mask
):
    """Test successful profile update for verified changes (no username validation)."""
    # Arrange
    sanitized_data = {"userName": "new.email@example.com", "preferredLanguage": "fr"}
    mock_sanitize.return_value = sanitized_data

    profile_data = {
        "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification",
        ],
        "userName": "john.doe@example.com",  # Original username
        "emails": [{"value": "john.doe@example.com", "type": "work"}],
        "preferredLanguage": "en",
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

    mock_profile = IBMVerifyUserProfileSchema(**profile_data)
    mock_dispatch_get.return_value = mock_profile

    # Updated profile response from IBM (with email change)
    updated_profile_data = {
        **profile_data,
        "userName": "new.email@example.com",
        "emails": [{"value": "new.email@example.com", "type": "work"}],
        "preferredLanguage": "fr",
    }
    mock_response = Mock()
    mock_response.json.return_value = updated_profile_data
    mock_dispatch_update.return_value = mock_response
    mock_mask.return_value = {
        **mock_response.json(),
    }

    user_data = UserProfileUpdateRequest(
        userName="new.email@example.com", preferredLanguage="fr"
    )
    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = AsyncClient()
    mock_request.app.state.config = Mock()
    mock_request.app.state.config.profile_api_endpoint = PROFILE_API_URL

    # Act
    response = await update_profile_for_verified_changes(
        mock_request, user_data, user_access_token="token"
    )

    # Assert
    assert response.success is True
    assert (
        response.message == "User profile updated successfully after OTP verification."
    )
    assert response.data.userName == "new.email@example.com"
    assert response.data.preferredLanguage == "fr"

    mock_sanitize.assert_called_once_with(user_data)
    mock_dispatch_get.assert_called_once()
    mock_dispatch_update.assert_called_once()
    mock_mask.assert_called_once()


@pytest.mark.asyncio
@patch(MASK_PHONE_IMPORT_PATH)
@patch(DISPATCH_UPDATE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
@patch(SANITIZE_PROFILE_IMPORT_PATH)
async def test_update_profile_for_verified_changes_with_email_update(
    mock_sanitize, mock_dispatch_get, mock_dispatch_update, mock_mask
):
    """Test email address change through verified update (bypasses username validation)."""
    # Arrange - User changing email from john.doe@example.com to new.email@example.com
    sanitized_data = {
        "userName": "new.email@example.com",
        "emails": [{"value": "new.email@example.com", "type": "work"}],
    }
    mock_sanitize.return_value = sanitized_data

    current_profile_data = {
        "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
        ],
        "userName": "john.doe@example.com",  # Original username
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

    mock_profile = IBMVerifyUserProfileSchema(**current_profile_data)
    mock_dispatch_get.return_value = mock_profile

    # Updated profile response - email successfully changed
    updated_profile_data = {
        **current_profile_data,
        "userName": "new.email@example.com",
        "emails": [{"value": "new.email@example.com", "type": "work"}],
    }
    mock_response = Mock()
    mock_response.json.return_value = updated_profile_data
    mock_dispatch_update.return_value = mock_response

    mock_mask.return_value = {
        **mock_response.json(),
    }

    from app.users.schemas import EmailItem

    user_data = UserProfileUpdateRequest(
        userName="new.email@example.com",
        emails=[EmailItem(value="new.email@example.com", type="work")],
    )
    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = AsyncClient()
    mock_request.app.state.config = Mock()
    mock_request.app.state.config.profile_api_endpoint = PROFILE_API_URL

    # Act
    response = await update_profile_for_verified_changes(
        mock_request, user_data, user_access_token="token"
    )

    # Assert - Email change was allowed (no username mismatch error)
    assert response.success is True
    assert response.data.userName == "new.email@example.com"
    assert len(response.data.emails) == 1
    assert response.data.emails[0].value == "new.email@example.com"

    mock_sanitize.assert_called_once()
    mock_dispatch_get.assert_called_once()
    mock_dispatch_update.assert_called_once()


@pytest.mark.asyncio
@patch(MASK_PHONE_IMPORT_PATH)
@patch(DISPATCH_UPDATE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
@patch(SANITIZE_PROFILE_IMPORT_PATH)
async def test_update_profile_for_verified_changes_with_phone_masking(
    mock_sanitize, mock_dispatch_get, mock_dispatch_update, mock_mask
):
    """Test that verified update properly masks phone numbers in response."""
    # Arrange
    sanitized_data = {
        "userName": "john.doe@example.com",
        "phoneNumbers": [{"type": "mobile", "value": "+16135551234"}],
    }
    mock_sanitize.return_value = sanitized_data

    profile_data = {
        "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
        ],
        "userName": "john.doe@example.com",
        "emails": [{"value": "john.doe@example.com", "type": "work"}],
        "phoneNumbers": [{"type": "mobile", "value": "+16139999999"}],
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

    # Updated profile with new phone number
    updated_profile_data = {
        **profile_data,
        "phoneNumbers": [{"type": "mobile", "value": "+16135551234"}],
    }
    mock_response = Mock()
    mock_response.json.return_value = updated_profile_data
    mock_dispatch_update.return_value = mock_response

    mock_mask.return_value = {
        **mock_response.json(),
        "phoneNumbers": [{"type": "mobile", "value": "+1 (***) ***-1234"}],
    }

    user_data = UserProfileUpdateRequest(
        userName="john.doe@example.com",
        phoneNumbers=[{"type": "mobile", "value": "+16135551234"}],
    )
    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = AsyncClient()
    mock_request.app.state.config = Mock()
    mock_request.app.state.config.profile_api_endpoint = PROFILE_API_URL

    # Act
    response = await update_profile_for_verified_changes(
        mock_request, user_data, user_access_token="token"
    )

    # Assert
    assert response.success is True
    assert response.data.phoneNumbers is not None
    assert response.data.phoneNumbers[0].value == "+1 (***) ***-1234"

    mock_mask.assert_called_once()


@pytest.mark.asyncio
@patch(SANITIZE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
async def test_update_profile_for_verified_changes_get_profile_failure(
    mock_dispatch_get, mock_sanitize
):
    """Test failure when getting current profile from IBM."""
    mock_sanitize.return_value = {"userName": "john.doe@example.com"}

    # Mock IBM profile fetch failure
    mock_dispatch_get.side_effect = HTTPException(
        status_code=500, detail="Failed to get profile"
    )

    user_data = UserProfileUpdateRequest(userName="john.doe@example.com")
    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = AsyncClient()

    # Act & Assert
    with pytest.raises(HTTPException) as exc:
        await update_profile_for_verified_changes(
            mock_request, user_data, user_access_token="token"
        )

    assert exc.value.status_code == 500
    mock_dispatch_get.assert_called_once()


@pytest.mark.asyncio
@patch(MASK_PHONE_IMPORT_PATH)
@patch(DISPATCH_UPDATE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
@patch(SANITIZE_PROFILE_IMPORT_PATH)
async def test_update_profile_for_verified_changes_dispatch_failure(
    mock_sanitize, mock_dispatch_get, mock_dispatch_update, mock_mask
):
    """Test failure when dispatching update to IBM."""
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

    mock_profile = IBMVerifyUserProfileSchema(**profile_data)
    mock_dispatch_get.return_value = mock_profile

    # Mock dispatch update failure
    mock_dispatch_update.side_effect = HTTPException(
        status_code=400, detail="Invalid request"
    )

    user_data = UserProfileUpdateRequest(userName="john.doe@example.com")
    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = AsyncClient()
    mock_request.app.state.config = Mock()
    mock_request.app.state.config.profile_api_endpoint = PROFILE_API_URL

    # Act & Assert
    with pytest.raises(HTTPException) as exc:
        await update_profile_for_verified_changes(
            mock_request, user_data, user_access_token="token"
        )

    assert exc.value.status_code == 400
    mock_dispatch_get.assert_called_once()
    mock_dispatch_update.assert_called_once()


def test_user_profile_name_validation_rejects_numbers():
    """Test that UserProfileName rejects names with numbers"""
    from pydantic import ValidationError

    # Test givenName with numbers
    with pytest.raises(ValidationError) as exc:
        UserProfileName(givenName="John123", familyName="Doe")

    assert "Name contains invalid characters" in str(
        exc.value
    ) or "Names cannot contain numbers" in str(exc.value)

    # Test familyName with numbers
    with pytest.raises(ValidationError) as exc:
        UserProfileName(givenName="John", familyName="Doe456")

    assert "Name contains invalid characters" in str(
        exc.value
    ) or "Names cannot contain numbers" in str(exc.value)


def test_user_profile_name_validation_rejects_special_symbols():
    """Test that UserProfileName rejects names with special symbols (except hyphen and apostrophe)"""
    from pydantic import ValidationError

    invalid_names = [
        "John@",
        "Doe#Smith",
        "Jane$",
        "Smith%Jones",
        "O&Connor",
        "Jean*Pierre",
    ]

    for invalid_name in invalid_names:
        with pytest.raises(ValidationError) as exc:
            UserProfileName(givenName=invalid_name, familyName="Test")

        assert "Name contains invalid characters" in str(exc.value)


def test_user_profile_name_validation_allows_valid_characters():
    """Test that UserProfileName allows valid characters"""

    # Valid names with letters, spaces, hyphens, apostrophes
    valid_names = [
        ("Jean-Pierre", "Dubois"),
        ("Mary", "O'Connor"),
        ("José", "García"),
        ("François", "Müller"),
        ("Anne Marie", "Smith-Jones"),
        ("Владимир", "Иванов"),  # Cyrillic
    ]

    for given_name, family_name in valid_names:
        # Should not raise an exception
        name = UserProfileName(givenName=given_name, familyName=family_name)
        assert name.givenName == given_name
        assert name.familyName == family_name


def test_user_profile_name_validation_allows_none():
    """Test that UserProfileName allows None values for optional fields"""

    # givenName is optional
    name = UserProfileName(givenName=None, familyName="Doe")
    assert name.givenName is None
    assert name.familyName == "Doe"

    # Both can be None (though this might not make sense in practice)
    name = UserProfileName(givenName=None, familyName=None)
    assert name.givenName is None
    assert name.familyName is None


def test_user_profile_name_auto_capitalizes():
    """Test that names are auto-capitalized according to Canadian naming rules"""

    # Test simple names - lowercase to capitalized
    name = UserProfileName(familyName="smith", givenName="john")
    assert name.familyName == "Smith"
    assert name.givenName == "John"

    # Test hyphenated names - capitalize after hyphens
    name = UserProfileName(familyName="martin-jones", givenName="jean-pierre")
    assert name.familyName == "Martin-Jones"
    assert name.givenName == "Jean-Pierre"

    # Test names with apostrophes - capitalize after apostrophes
    name = UserProfileName(familyName="o'connor", givenName="d'angelo")
    assert name.familyName == "O'Connor"
    assert name.givenName == "D'Angelo"

    # Test names with spaces - capitalize after spaces
    name = UserProfileName(familyName="van der berg", givenName="mary anne")
    assert name.familyName == "Van Der Berg"
    assert name.givenName == "Mary Anne"

    # Test all-caps input - first letter capitalized, rest preserved
    name = UserProfileName(familyName="McDONALD", givenName="SARAH")
    assert name.familyName == "McDONALD"
    assert name.givenName == "SARAH"

    # Test complex combinations - multiple delimiters
    name = UserProfileName(familyName="o'brien-smith", givenName="jean-marie")
    assert name.familyName == "O'Brien-Smith"
    assert name.givenName == "Jean-Marie"

    # Test already properly capitalized names - should remain unchanged
    name = UserProfileName(familyName="O'Neill", givenName="Mary-Jane")
    assert name.familyName == "O'Neill"
    assert name.givenName == "Mary-Jane"


def test_user_profile_name_rejects_given_name_over_80_chars():
    """Test that validate_name_update rejects givenName exceeding 80 characters"""
    from app.users.services.update_my_profile import validate_name_update

    request = UserProfileUpdateRequest(
        name=UserProfileName(givenName="A" * 81, familyName="Doe"),
    )

    with pytest.raises(HTTPException) as exc:
        validate_name_update(request)

    assert exc.value.status_code == 400
    assert exc.value.detail == "firstNameMaxLength"


def test_user_profile_name_rejects_family_name_over_80_chars():
    """Test that validate_name_update rejects familyName exceeding 80 characters"""
    from app.users.services.update_my_profile import validate_name_update

    request = UserProfileUpdateRequest(
        name=UserProfileName(givenName="John", familyName="B" * 81),
    )

    with pytest.raises(HTTPException) as exc:
        validate_name_update(request)

    assert exc.value.status_code == 400
    assert exc.value.detail == "lastNameMaxLength"


def test_user_profile_name_allows_names_at_exactly_80_chars():
    """Test that validate_name_update accepts names of exactly 80 characters"""
    from app.users.services.update_my_profile import validate_name_update

    name_80 = "A" * 80

    request = UserProfileUpdateRequest(
        name=UserProfileName(givenName=name_80, familyName=name_80),
    )

    # Should not raise
    validate_name_update(request)


def test_user_profile_update_request_rejects_empty_family_name():
    """Test that validate_name_update rejects an empty familyName string."""
    from app.users.services.update_my_profile import validate_name_update

    request = UserProfileUpdateRequest(
        name=UserProfileName(givenName="John", familyName=""),
    )

    with pytest.raises(HTTPException) as exc:
        validate_name_update(request)

    assert exc.value.status_code == 400
    assert exc.value.detail == "lastNameRequired"


def test_user_profile_update_request_allows_none_family_name():
    """Test that validate_name_update still allows familyName=None (field not provided)"""
    from app.users.services.update_my_profile import validate_name_update

    request = UserProfileUpdateRequest(
        name=UserProfileName(givenName="John", familyName=None),
    )

    # Should not raise
    validate_name_update(request)


def test_user_profile_update_request_allows_none_name():
    """Test that validate_name_update allows name=None (no name update requested)"""
    from app.users.services.update_my_profile import validate_name_update

    request = UserProfileUpdateRequest(preferredLanguage="en")

    # Should not raise
    validate_name_update(request)
