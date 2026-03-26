import pytest
import respx
from fastapi import HTTPException
from httpx import AsyncClient, Response
from unittest.mock import Mock, patch

from app.users.services.get_my_profile import (
    get_my_profile as my_profile,
    dispatch_get_my_profile_from_ibm,
)

from app.users.schemas import IBMVerifyUserProfileSchema


PROFILE_API_URL = "https://fake-tenant.verify.ibm.com/v2.0/Me"
GET_PROFILE_DISPATCH_FROM_IBM_IMPORT_PATH = (
    "app.users.services.get_my_profile.dispatch_get_my_profile_from_ibm"
)


@pytest.mark.asyncio
@patch("app.users.services.get_my_profile.mask_profile_details")
@patch(GET_PROFILE_DISPATCH_FROM_IBM_IMPORT_PATH)
async def test_my_profile_success(mock_dispatch_get, mock_mask_profile):
    # Arrange
    profile_data = {
        "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
        ],
        "userName": "jo****@example.com",
        "emails": [{"value": "jo****@example.com", "type": "work"}],
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
    mock_mask_profile.return_value = profile_data

    http_client = AsyncClient()

    # Act
    response = await my_profile(http_client, user_access_token="mock-token")

    # Assert
    assert response.success is True
    assert response.data.userName == "jo****@example.com"
    assert response.data.id == "user-123"
    mock_dispatch_get.assert_called_once_with(http_client, "mock-token")


@pytest.mark.asyncio
@patch(GET_PROFILE_DISPATCH_FROM_IBM_IMPORT_PATH)
async def test_my_profile_unauthorized(mock_dispatch_get):
    # Arrange - mock dispatch_get_my_profile_from_ibm to raise HTTPException with 401
    mock_dispatch_get.side_effect = HTTPException(
        status_code=401, detail="Not authenticated"
    )

    http_client = AsyncClient()

    # Act & Assert
    with pytest.raises(HTTPException) as exc:
        await my_profile(http_client, user_access_token="mock-token")

    assert exc.value.status_code == 401
    assert "Not authenticated" in str(exc.value.detail)
    mock_dispatch_get.assert_called_once_with(http_client, "mock-token")


@pytest.mark.asyncio
@patch(GET_PROFILE_DISPATCH_FROM_IBM_IMPORT_PATH)
async def test_my_profile_other_error(mock_dispatch_get):
    # Arrange - mock dispatch_get_my_profile_from_ibm to raise HTTPException with 500
    mock_dispatch_get.side_effect = HTTPException(
        status_code=500, detail="HTTP error occurred"
    )

    http_client = AsyncClient()

    # Act & Assert
    with pytest.raises(HTTPException) as exc:
        await my_profile(http_client, user_access_token="mock-token")

    assert exc.value.status_code == 500
    assert "HTTP error" in str(exc.value.detail)
    mock_dispatch_get.assert_called_once_with(http_client, "mock-token")


@pytest.mark.asyncio
@respx.mock
async def test_dispatch_get_my_profile_from_ibm_success(monkeypatch):
    """Test that dispatch_get_my_profile_from_ibm returns unmasked phone numbers."""
    # Arrange
    test_url = "https://mocked-api.ibm.com/v2.0/Me"

    monkeypatch.setattr(
        "app.users.services.get_my_profile.get_configuration",
        lambda: Mock(profile_api_endpoint=test_url),
    )

    profile_data = {
        "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
        ],
        "userName": "jo****@example.com",
        "emails": [{"value": "jo****@example.com", "type": "work"}],
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
    }

    respx.get(test_url).mock(return_value=Response(status_code=200, json=profile_data))

    http_client = AsyncClient()

    # Act
    response = await dispatch_get_my_profile_from_ibm(
        http_client, user_access_token="mock-token"
    )

    # Assert
    assert isinstance(response, IBMVerifyUserProfileSchema)
    assert response.userName == "jo****@example.com"
    assert response.id == "user-123"

    # Verify phone numbers are NOT masked
    assert len(response.phoneNumbers) == 2
    assert response.phoneNumbers[0].value == "+1-613-555-1234"
    assert response.phoneNumbers[0].type == "mobile"
    assert response.phoneNumbers[1].value == "+1-613-555-5678"
    assert response.phoneNumbers[1].type == "work"

    # Ensure no masking characters are present
    for phone in response.phoneNumbers:
        assert "*" not in phone.value
        assert "X" not in phone.value


@pytest.mark.asyncio
@patch("app.users.services.get_my_profile.mask_profile_details")
@patch(GET_PROFILE_DISPATCH_FROM_IBM_IMPORT_PATH)
async def test_my_profile_with_masked_phone_numbers(
    mock_dispatch_get, mock_mask_profile
):
    """Test that get_my_profile returns masked phone numbers."""
    # Arrange
    profile_data = {
        "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
        ],
        "userName": "jo****@example.com",
        "emails": [{"value": "jo****@example.com", "type": "work"}],
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
    }

    # Mock dispatch_get_my_profile_from_ibm to return unmasked profile
    mock_profile = IBMVerifyUserProfileSchema(**profile_data)
    mock_dispatch_get.return_value = mock_profile

    # Mock mask_contact_phone_numbers to return masked phone numbers
    masked_phones = [
        {"value": "+1-613-XXX-XX34", "type": "mobile"},
        {"value": "+1-613-XXX-XX78", "type": "work"},
    ]

    mock_mask_profile.return_value = {
        **profile_data,
        "phoneNumbers": masked_phones,
    }

    http_client = AsyncClient()

    # Act
    response = await my_profile(http_client, user_access_token="mock-token")

    # Assert
    assert response.success is True
    assert response.message == "User profile retrieved successfully."
    assert response.data.userName == "jo****@example.com"
    assert response.data.id == "user-123"

    # Verify phone numbers are masked
    assert len(response.data.phoneNumbers) == 2
    assert response.data.phoneNumbers[0].value == "+1-613-XXX-XX34"
    assert response.data.phoneNumbers[0].type == "mobile"
    assert response.data.phoneNumbers[1].value == "+1-613-XXX-XX78"
    assert response.data.phoneNumbers[1].type == "work"

    # Verify masking function was called with correct data
    mock_mask_profile.assert_called_once_with(mock_profile.model_dump())

    call_args = mock_mask_profile.call_args[0][0]
    assert call_args["userName"] == "jo****@example.com"
    assert len(call_args["phoneNumbers"]) == 2

    # Verify dispatch was called
    mock_dispatch_get.assert_called_once_with(http_client, "mock-token")


@pytest.mark.asyncio
@patch("app.users.services.get_my_profile.mask_profile_details")
@patch(GET_PROFILE_DISPATCH_FROM_IBM_IMPORT_PATH)
async def test_my_profile_with_no_phone_numbers(mock_dispatch_get, mock_mask_profile):
    """Test that get_my_profile handles profiles with no phone numbers."""
    # Arrange
    profile_data = {
        "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
        ],
        "userName": "jane.doe@example.com",
        "emails": [{"value": "jane.doe@example.com", "type": "work"}],
        "phoneNumbers": [],
        "meta": {
            "location": "here",
            "created": "2023-01-01T00:00:00Z",
            "lastModified": "2023-09-22T12:30:00Z",
            "resourceType": "User",
        },
        "active": True,
        "id": "user-456",
    }

    mock_profile = IBMVerifyUserProfileSchema(**profile_data)
    mock_dispatch_get.return_value = mock_profile
    mock_mask_profile.return_value = {
        **profile_data,
        "userName": "ja****@example.com",
        "phoneNumbers": [],
    }

    http_client = AsyncClient()

    # Act
    response = await my_profile(http_client, user_access_token="mock-token")

    # Assert
    assert response.success is True

    assert response.data.userName == "ja****@example.com"
    assert len(response.data.phoneNumbers) == 0

    # Verify masking was still called (even with empty list)
    mock_mask_profile.assert_called_once()
    mock_dispatch_get.assert_called_once_with(http_client, "mock-token")
