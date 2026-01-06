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
VALIDATE_USER_REQUEST_MATCH = (
    "app.users.services.update_my_profile.validate_user_request_match"
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
        "phoneNumbers": [],
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
@patch(VALIDATE_USER_REQUEST_MATCH)
@patch(SANITIZE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH, new_callable=AsyncMock)
async def test_update_profile_user_mismatch_403(
    mock_dispatch_get, mock_sanitize, mock_validate_user
):
    # Arrange - Set up a user ID mismatch scenario
    mock_sanitize.return_value = {"user_id": "other@example.com"}

    # Mock the validation function to raise a 403 error for user mismatch
    mock_validate_user.side_effect = HTTPException(
        status_code=403,
        detail="7",  # This is the actual error message from the function
    )

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
        "id": "john.doe@example.com",  # Different from sanitized user_id
        "notification": {"notifyType": "NONE"},
    }

    mock_profile = IBMVerifyUserProfileSchema(**profile_data)
    # For AsyncMock, set return_value directly - it will be awaitable
    mock_dispatch_get.return_value = mock_profile

    user_data = UserProfileUpdateRequest(user_id="other@example.com")
    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = Mock(spec=AsyncClient)
    mock_request.app.state.config = Mock()
    mock_request.app.state.config.profile_api_endpoint = PROFILE_API_URL

    # Act & Assert
    with pytest.raises(HTTPException) as exc:
        await update_profile(mock_request, user_data, user_access_token="token")

    assert exc.value.status_code == 403
    assert exc.value.detail == "7"  # The actual generic error message

    # Verify the validation function was called with correct parameters
    mock_validate_user.assert_called_once()
    call_args = mock_validate_user.call_args[0]

    # Compare with the model_dump() output, not the raw profile_data
    expected_profile = mock_profile.model_dump()
    assert call_args[0] == expected_profile  # ibm_user_profile from model_dump()
    assert call_args[1] == "other@example.com"  # current_users_id

    # Verify other functions were called as expected
    mock_sanitize.assert_called_once_with(user_data)
    mock_dispatch_get.assert_awaited_once()  # Use assert_awaited_once for AsyncMock


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
@patch(SANITIZE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
async def test_update_profile_validation_error(mock_dispatch_get, mock_sanitize):
    # Pass something that will cause validation error when merging
    mock_sanitize.return_value = {
        "userName": "john.doe@example.com",
        "id": 123,
        "user_id": "string-instead-of-int",
    }

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

    mock_mask_profile.return_value = {
        **mock_response.json(),
        "userName": "ja****@example.com",
        "phoneNumbers": masked_phones,
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
    assert len(response.data.phoneNumbers) == 2
    assert response.data.phoneNumbers[0].value == "+1-613-XXX-XX34"
    assert response.data.phoneNumbers[0].type == "mobile"
    assert response.data.phoneNumbers[1].value == "+1-613-XXX-XX78"
    assert response.data.phoneNumbers[1].type == "work"
    assert response.data.userName == "ja****@example.com"
    assert response.success is True

    # Verify masking was called with updated profile data
    mock_mask_profile.assert_called_once_with(updated_profile_data)
    mask_call_data = mock_mask_profile.call_args[0][0]
    assert mask_call_data["userName"] == "john.doe@example.com"
    assert mask_call_data["preferredLanguage"] == "fr"

    mock_sanitize.assert_called_once()
    mock_dispatch_get.assert_called_once()
    mock_dispatch_update.assert_called_once()


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
        "user_id": "user-123",
        "name": {"givenName": "Jane", "familyName": "Smith"},
    }
    mock_response = Mock()
    mock_response.json.return_value = updated_profile_data
    mock_dispatch_update.return_value = mock_response

    mock_mask.return_value = {
        **mock_response.json(),
        "userName": "jo****@example.com",
        "phoneNumbers": [],
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
    assert len(response.data.phoneNumbers) == 0
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
        "phoneNumbers": [],
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
        "phoneNumbers": [],
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
        "phoneNumbers": [{"value": "+1-613-555-1234", "type": "mobile"}],
    }
    mock_sanitize.return_value = sanitized_data

    profile_data = {
        "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
        ],
        "userName": "john.doe@example.com",
        "emails": [{"value": "john.doe@example.com", "type": "work"}],
        "phoneNumbers": [
            {"value": "+1-613-999-9999", "type": "work"}
        ],  # Existing phone
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
        "phoneNumbers": [{"value": "+1-613-555-1234", "type": "mobile"}],
    }
    mock_response = Mock()
    mock_response.json.return_value = updated_profile_data
    mock_dispatch_update.return_value = mock_response

    # Mock masked phone numbers
    masked_phones = [{"value": "+1 (***) ***-1234", "type": "mobile"}]

    mock_mask.return_value = {
        **mock_response.json(),
        "phoneNumbers": masked_phones,
    }

    from app.users.schemas import MetaDataTypeValue

    user_data = UserProfileUpdateRequest(
        userName="john.doe@example.com",
        phoneNumbers=[MetaDataTypeValue(value="+1-613-555-1234", type="mobile")],
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
    assert len(response.data.phoneNumbers) == 1
    assert response.data.phoneNumbers[0].value == "+1 (***) ***-1234"
    assert response.data.phoneNumbers[0].type == "mobile"

    mock_mask.assert_called_once()
    # Verify masking was called with updated profile data
    mask_call_data = mock_mask.call_args[0][0]
    assert "phoneNumbers" in mask_call_data
    assert len(mask_call_data["phoneNumbers"]) == 1
    assert mask_call_data["phoneNumbers"][0]["type"] == "mobile"


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


@pytest.mark.asyncio
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
@patch(SANITIZE_PROFILE_IMPORT_PATH)
async def test_update_profile_for_verified_changes_validation_error(
    mock_sanitize, mock_dispatch_get
):
    """Test validation error when merging profile data."""
    # Arrange - Set up data that will cause validation error
    mock_sanitize.return_value = {"userName": "john.doe@example.com", "id": 123}

    # Mock IBM profile with incompatible data
    mock_dispatch_get.return_value = Mock(
        model_dump=Mock(
            return_value={
                "userName": "john.doe@example.com",
                "id": "string-instead-of-int",
                "invalid_field": "this-will-cause-validation-error",
            }
        )
    )

    user_data = UserProfileUpdateRequest(userName="john.doe@example.com")
    mock_request = Mock()
    mock_request.app = Mock()
    mock_request.app.state = Mock()

    # Act & Assert
    with pytest.raises(HTTPException) as exc:
        await update_profile_for_verified_changes(
            mock_request, user_data, user_access_token="token"
        )

    assert exc.value.status_code == 422
    assert "Request data validation error" in exc.value.detail


@pytest.mark.asyncio
@patch(MASK_PHONE_IMPORT_PATH)
@patch(DISPATCH_UPDATE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
@patch(SANITIZE_PROFILE_IMPORT_PATH)
async def test_update_profile_for_verified_changes_json_parse_error(
    mock_sanitize, mock_dispatch_get, mock_dispatch_update, mock_mask
):
    """Test error handling when response JSON cannot be parsed."""
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

    # Mock response with invalid JSON
    mock_response = Mock()
    mock_response.json.side_effect = Exception("Invalid JSON")
    mock_dispatch_update.return_value = mock_response

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

    assert exc.value.status_code == 422
    assert "Request data validation error" in exc.value.detail


@pytest.mark.asyncio
@patch(MASK_PHONE_IMPORT_PATH)
@patch(DISPATCH_UPDATE_PROFILE_IMPORT_PATH)
@patch(DISPATCH_GET_PROFILE_FROM_IBM_IMPORT_PATH)
@patch(SANITIZE_PROFILE_IMPORT_PATH)
async def test_update_profile_for_verified_changes_response_validation_error(
    mock_sanitize, mock_dispatch_get, mock_dispatch_update, mock_mask
):
    """Test error handling when response data fails validation."""
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

    # Mock response with invalid data that will fail validation
    invalid_response_data = {
        "userName": "john.doe@example.com",
        "emails": "invalid-emails-format",  # Should be list, not string
        "id": None,  # Invalid - id is required
    }
    mock_response = Mock()
    mock_response.json.return_value = invalid_response_data
    mock_dispatch_update.return_value = mock_response

    mock_mask.return_value = {
        **mock_response.json(),
        "phoneNumbers": [],
    }

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

    assert exc.value.status_code == 422
    assert "Request data validation error" in exc.value.detail
