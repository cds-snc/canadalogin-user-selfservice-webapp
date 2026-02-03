"""
Unit tests for FIDO2 get_registration_details.py module

Tests the get_registration_details function.
Uses importlib to import the actual module for patching.
"""

import importlib
import pytest
from fastapi import HTTPException, status
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

# Import the module using importlib to get the actual module object
get_details_module = importlib.import_module(
    "app.fido2.services.get_registration_details"
)

# Import the function directly for testing
get_registration_details = get_details_module.get_registration_details


class TestGetRegistrationDetails:
    """Tests for get_registration_details function"""

    @pytest.fixture
    def mock_http_client(self):
        """Create a mock HTTP client"""
        return AsyncMock(spec=AsyncClient)

    @pytest.fixture
    def mock_registration_data(self):
        """Create mock registration data returned by verify_registration_ownership"""
        return {
            "id": "reg-123",
            "userId": "user-456",
            "type": "<type>",
            "created": "2018-07-16T02:13:47.719Z",
            "updated": "2018-07-16T02:13:47.719Z",
            "attempted": "2018-07-16T02:13:47.719Z",
            "enabled": True,
            "validated": True,
            "attributes": {
                "attestationType": "Basic",
                "attestationFormat": "packed",
                "nickname": "My FIDO Authenticator",
                "aaGuid": "1e5fa156-3754-4265-8796-1a2f0a6f036f",
                "userVerified": True,
                "userPresent": True,
                "icon": "string",
                "description": "string",
                "credentialId": "string",
                "credentialPublicKey": "string",
                "rpId": "string",
                "counter": 0,
                "transports": ["string"],
                "x5c": ["string"],
                "backupEligibility": True,
                "backupState": True,
            },
            "references": {"rpUuid": "string"},
            "assertion": "string",
        }

    @pytest.fixture
    def mock_registration_data_no_attributes(self):
        """Create mock registration data without attributes"""
        return {
            "id": "reg-123",
            "userId": "user-456",
            "rpId": "example.com",
            "enabled": True,
            "references": {"rpUuid": "rp-uuid-123"},
            "type": "<type>",
            "created": "2018-07-16T02:13:47.719Z",
            "updated": "2018-07-16T02:13:47.719Z",
            "validated": True,
        }

    @pytest.mark.asyncio
    @patch.object(get_details_module, "verify_registration_ownership")
    @patch.object(get_details_module, "get_admin_token")
    @patch.object(get_details_module, "get_user_profile_info")
    async def test_successful_get_registration_details(
        self,
        mock_get_user_profile_info,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_http_client,
        mock_registration_data,
    ):
        """Should successfully retrieve registration details"""
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_verify_registration_ownership.return_value = mock_registration_data

        result = await get_registration_details(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            registration_id="reg-123",
        )

        assert result.success is True
        assert result.data.id == "reg-123"
        assert result.message == "Registration details retrieved successfully"
        mock_get_user_profile_info.assert_called_once_with(
            mock_http_client, "user-token-abc"
        )
        mock_get_admin_token.assert_called_once_with(mock_http_client)
        mock_verify_registration_ownership.assert_called_once_with(
            mock_http_client, "admin-token-xyz", "reg-123", "user-456"
        )

    @pytest.mark.asyncio
    @patch.object(get_details_module, "verify_registration_ownership")
    @patch.object(get_details_module, "get_admin_token")
    @patch.object(get_details_module, "get_user_profile_info")
    async def test_adds_transactions_array_to_attributes(
        self,
        mock_get_user_profile_info,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_http_client,
        mock_registration_data,
    ):
        """Should add empty transactions array to attributes"""
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_verify_registration_ownership.return_value = mock_registration_data.copy()

        result = await get_registration_details(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            registration_id="reg-123",
        )

        assert result.success is True
        # The transactions should be added to the registration data
        assert (
            mock_verify_registration_ownership.return_value["attributes"][
                "transactions"
            ]
            == []
        )

    @pytest.mark.asyncio
    @patch.object(get_details_module, "verify_registration_ownership")
    @patch.object(get_details_module, "get_admin_token")
    @patch.object(get_details_module, "get_user_profile_info")
    async def test_creates_attributes_if_missing(
        self,
        mock_get_user_profile_info,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_http_client,
        mock_registration_data_no_attributes,
    ):
        """Should create attributes dict if missing and add transactions"""
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_admin_token.return_value = "admin-token-xyz"
        # Registration without attributes - but with all required fields
        mock_verify_registration_ownership.return_value = (
            mock_registration_data_no_attributes
        )

        result = await get_registration_details(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            registration_id="reg-123",
        )

        assert result.success is True

    @pytest.mark.asyncio
    @patch.object(get_details_module, "get_user_profile_info")
    async def test_propagates_http_exception_from_user_id(
        self,
        mock_get_user_profile_info,
        mock_http_client,
    ):
        """Should propagate HTTPException when getting user ID fails"""
        mock_get_user_profile_info.side_effect = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

        with pytest.raises(HTTPException) as exc:
            await get_registration_details(
                http_client=mock_http_client,
                user_access_token="invalid-token",
                registration_id="reg-123",
            )

        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    @patch.object(get_details_module, "get_admin_token")
    @patch.object(get_details_module, "get_user_profile_info")
    async def test_propagates_http_exception_from_admin_token(
        self,
        mock_get_user_profile_info,
        mock_get_admin_token,
        mock_http_client,
    ):
        """Should propagate HTTPException when getting admin token fails"""
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_admin_token.side_effect = HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Token service unavailable",
        )

        with pytest.raises(HTTPException) as exc:
            await get_registration_details(
                http_client=mock_http_client,
                user_access_token="user-token-abc",
                registration_id="reg-123",
            )

        assert exc.value.status_code == status.HTTP_503_SERVICE_UNAVAILABLE

    @pytest.mark.asyncio
    @patch.object(get_details_module, "verify_registration_ownership")
    @patch.object(get_details_module, "get_admin_token")
    @patch.object(get_details_module, "get_user_profile_info")
    async def test_propagates_http_exception_from_ownership_verification(
        self,
        mock_get_user_profile_info,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_http_client,
    ):
        """Should propagate HTTPException when ownership verification fails"""
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_verify_registration_ownership.side_effect = HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not own this registration",
        )

        with pytest.raises(HTTPException) as exc:
            await get_registration_details(
                http_client=mock_http_client,
                user_access_token="user-token-abc",
                registration_id="reg-123",
            )

        assert exc.value.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    @patch.object(get_details_module, "RequestErrorHandler")
    @patch.object(get_details_module, "get_user_profile_info")
    async def test_handles_generic_exception(
        self,
        mock_get_user_profile_info,
        mock_request_error_handler,
        mock_http_client,
    ):
        """Should handle generic exceptions with RequestErrorHandler"""
        mock_get_user_profile_info.side_effect = Exception("Unexpected error")

        await get_registration_details(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            registration_id="reg-123",
        )

        mock_request_error_handler.handle.assert_called_once()
        error_arg = mock_request_error_handler.handle.call_args[0][0]
        assert isinstance(error_arg, Exception)
        assert "Unexpected error" in str(error_arg)

    @pytest.mark.asyncio
    @patch.object(get_details_module, "verify_registration_ownership")
    @patch.object(get_details_module, "get_admin_token")
    @patch.object(get_details_module, "get_user_profile_info")
    async def test_uses_correct_token_for_each_call(
        self,
        mock_get_user_profile_info,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_http_client,
        mock_registration_data,
    ):
        """Should use user token for user ID and admin token for ownership verification"""
        user_token = "specific-user-token"
        admin_token = "specific-admin-token"

        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_admin_token.return_value = admin_token
        mock_verify_registration_ownership.return_value = mock_registration_data

        await get_registration_details(
            http_client=mock_http_client,
            user_access_token=user_token,
            registration_id="reg-123",
        )

        # User token used for getting user ID
        mock_get_user_profile_info.assert_called_once_with(mock_http_client, user_token)
        # Admin token used for ownership verification
        mock_verify_registration_ownership.assert_called_once_with(
            mock_http_client, admin_token, "reg-123", "user-456"
        )

    @pytest.mark.asyncio
    @patch.object(get_details_module, "verify_registration_ownership")
    @patch.object(get_details_module, "get_admin_token")
    @patch.object(get_details_module, "get_user_profile_info")
    async def test_different_registration_ids(
        self,
        mock_get_user_profile_info,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_http_client,
        mock_registration_data_no_attributes,
    ):
        """Should handle different registration ID formats"""
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_admin_token.return_value = "admin-token-xyz"

        # Test with UUID-style registration ID
        uuid_registration_id = "550e8400-e29b-41d4-a716-446655440000"
        mock_verify_registration_ownership.return_value = (
            mock_registration_data_no_attributes
        )

        result = await get_registration_details(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            registration_id=uuid_registration_id,
        )

        assert result.success is True
        mock_verify_registration_ownership.assert_called_with(
            mock_http_client, "admin-token-xyz", uuid_registration_id, "user-456"
        )

    @pytest.mark.asyncio
    @patch.object(get_details_module, "RequestErrorHandler")
    @patch.object(get_details_module, "verify_registration_ownership")
    @patch.object(get_details_module, "get_admin_token")
    @patch.object(get_details_module, "get_user_profile_info")
    async def test_handles_connection_error(
        self,
        mock_get_user_profile_info,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_request_error_handler,
        mock_http_client,
    ):
        """Should handle connection errors"""
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_verify_registration_ownership.side_effect = ConnectionError(
            "Connection refused"
        )

        await get_registration_details(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            registration_id="reg-123",
        )

        mock_request_error_handler.handle.assert_called_once()
