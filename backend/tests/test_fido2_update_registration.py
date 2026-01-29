"""
Unit tests for FIDO2 update_fido2_registration.py module

Tests the update_registration function.
Uses importlib to import the actual module for patching.
"""

import importlib
import pytest
from fastapi import HTTPException, status
from httpx import AsyncClient, HTTPStatusError, Request, Response
from unittest.mock import AsyncMock, MagicMock, patch

# Import the module using importlib to get the actual module object
update_module = importlib.import_module("app.fido2.services.update_fido2_registration")

# Import the function directly for testing
update_registration = update_module.update_registration


class TestUpdateRegistration:
    """Tests for update_registration function"""

    @pytest.fixture
    def mock_http_client(self):
        """Create a mock HTTP client"""
        return AsyncMock(spec=AsyncClient)

    @pytest.fixture
    def mock_request_data_nickname(self):
        """Create mock request data with nickname update"""
        mock_data = MagicMock()
        mock_data.id = "reg-123"
        mock_data.nickname = "New Passkey Name"
        mock_data.enabled = None
        return mock_data

    @pytest.fixture
    def mock_request_data_enabled(self):
        """Create mock request data with enabled status update"""
        mock_data = MagicMock()
        mock_data.id = "reg-123"
        mock_data.nickname = None
        mock_data.enabled = False
        return mock_data

    @pytest.fixture
    def mock_request_data_both(self):
        """Create mock request data with both nickname and enabled update"""
        mock_data = MagicMock()
        mock_data.id = "reg-123"
        mock_data.nickname = "Updated Name"
        mock_data.enabled = True
        return mock_data

    @pytest.fixture
    def mock_registration_data(self):
        """Create mock existing registration data"""
        return {
            "id": "reg-123",
            "userId": "user-456",
            "enabled": True,
            "created": "2024-01-15T10:30:00Z",
            "attributes": {
                "nickname": "Old Passkey Name",
                "rpId": "example.com",
                "credentialId": "cred-abc-123",
            },
            "references": {
                "rpUuid": "rp-uuid-123",
            },
        }

    @pytest.fixture
    def mock_user_response(self):
        """Create a mock FIDO2 user response"""
        return MagicMock(
            success=True,
            data=MagicMock(credentials=[]),
        )

    @pytest.mark.asyncio
    @patch.object(update_module, "get_user_response")
    @patch.object(update_module, "get_auth_request_headers")
    @patch.object(update_module, "verify_registration_ownership")
    @patch.object(update_module, "get_admin_token")
    @patch.object(update_module, "get_user_id_from_token")
    @patch.object(update_module, "get_tenant_url")
    async def test_successful_nickname_update(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_get_user_response,
        mock_http_client,
        mock_request_data_nickname,
        mock_registration_data,
        mock_user_response,
    ):
        """Should successfully update registration nickname"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_verify_registration_ownership.return_value = mock_registration_data.copy()
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }
        mock_get_user_response.return_value = mock_user_response

        mock_put_response = MagicMock()
        mock_put_response.raise_for_status = MagicMock()
        mock_http_client.put = AsyncMock(return_value=mock_put_response)

        result = await update_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data_nickname,
        )

        assert result == mock_user_response
        mock_http_client.put.assert_called_once()
        call_kwargs = mock_http_client.put.call_args[1]
        assert call_kwargs["json"]["attributes"]["nickname"] == "New Passkey Name"

    @pytest.mark.asyncio
    @patch.object(update_module, "get_user_response")
    @patch.object(update_module, "get_auth_request_headers")
    @patch.object(update_module, "verify_registration_ownership")
    @patch.object(update_module, "get_admin_token")
    @patch.object(update_module, "get_user_id_from_token")
    @patch.object(update_module, "get_tenant_url")
    async def test_successful_enabled_status_update(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_get_user_response,
        mock_http_client,
        mock_request_data_enabled,
        mock_registration_data,
        mock_user_response,
    ):
        """Should successfully update registration enabled status"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_verify_registration_ownership.return_value = mock_registration_data.copy()
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }
        mock_get_user_response.return_value = mock_user_response

        mock_put_response = MagicMock()
        mock_put_response.raise_for_status = MagicMock()
        mock_http_client.put = AsyncMock(return_value=mock_put_response)

        result = await update_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data_enabled,
        )

        assert result == mock_user_response
        call_kwargs = mock_http_client.put.call_args[1]
        assert call_kwargs["json"]["enabled"] is False

    @pytest.mark.asyncio
    @patch.object(update_module, "get_user_response")
    @patch.object(update_module, "get_auth_request_headers")
    @patch.object(update_module, "verify_registration_ownership")
    @patch.object(update_module, "get_admin_token")
    @patch.object(update_module, "get_user_id_from_token")
    @patch.object(update_module, "get_tenant_url")
    async def test_update_both_nickname_and_enabled(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_get_user_response,
        mock_http_client,
        mock_request_data_both,
        mock_registration_data,
        mock_user_response,
    ):
        """Should update both nickname and enabled status"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_verify_registration_ownership.return_value = mock_registration_data.copy()
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }
        mock_get_user_response.return_value = mock_user_response

        mock_put_response = MagicMock()
        mock_put_response.raise_for_status = MagicMock()
        mock_http_client.put = AsyncMock(return_value=mock_put_response)

        await update_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data_both,
        )

        call_kwargs = mock_http_client.put.call_args[1]
        assert call_kwargs["json"]["attributes"]["nickname"] == "Updated Name"
        assert call_kwargs["json"]["enabled"] is True

    @pytest.mark.asyncio
    @patch.object(update_module, "get_user_response")
    @patch.object(update_module, "get_auth_request_headers")
    @patch.object(update_module, "verify_registration_ownership")
    @patch.object(update_module, "get_admin_token")
    @patch.object(update_module, "get_user_id_from_token")
    @patch.object(update_module, "get_tenant_url")
    async def test_preserves_existing_attributes(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_get_user_response,
        mock_http_client,
        mock_request_data_nickname,
        mock_registration_data,
        mock_user_response,
    ):
        """Should preserve existing attributes when updating"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_verify_registration_ownership.return_value = mock_registration_data.copy()
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }
        mock_get_user_response.return_value = mock_user_response

        mock_put_response = MagicMock()
        mock_put_response.raise_for_status = MagicMock()
        mock_http_client.put = AsyncMock(return_value=mock_put_response)

        await update_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data_nickname,
        )

        call_kwargs = mock_http_client.put.call_args[1]
        payload = call_kwargs["json"]
        # Should preserve rpId and credentialId
        assert payload["attributes"]["rpId"] == "example.com"
        assert payload["attributes"]["credentialId"] == "cred-abc-123"

    @pytest.mark.asyncio
    @patch.object(update_module, "get_user_response")
    @patch.object(update_module, "get_auth_request_headers")
    @patch.object(update_module, "verify_registration_ownership")
    @patch.object(update_module, "get_admin_token")
    @patch.object(update_module, "get_user_id_from_token")
    @patch.object(update_module, "get_tenant_url")
    async def test_calls_correct_endpoint(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_get_user_response,
        mock_http_client,
        mock_request_data_nickname,
        mock_registration_data,
        mock_user_response,
    ):
        """Should call correct FIDO2 registrations endpoint with PUT"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_verify_registration_ownership.return_value = mock_registration_data.copy()
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }
        mock_get_user_response.return_value = mock_user_response

        mock_put_response = MagicMock()
        mock_put_response.raise_for_status = MagicMock()
        mock_http_client.put = AsyncMock(return_value=mock_put_response)

        await update_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data_nickname,
        )

        call_args = mock_http_client.put.call_args[0]
        put_url = call_args[0]
        assert "/v2.0/factors/fido2/registrations/reg-123" in put_url

    @pytest.mark.asyncio
    @patch.object(update_module, "RequestErrorHandler")
    @patch.object(update_module, "get_user_id_from_token")
    @patch.object(update_module, "get_tenant_url")
    async def test_handles_get_user_id_error(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_request_error_handler,
        mock_http_client,
        mock_request_data_nickname,
    ):
        """Should handle error when getting user ID fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.side_effect = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

        await update_registration(
            http_client=mock_http_client,
            user_access_token="invalid-token",
            request_data=mock_request_data_nickname,
        )

        mock_request_error_handler.handle.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(update_module, "RequestErrorHandler")
    @patch.object(update_module, "get_admin_token")
    @patch.object(update_module, "get_user_id_from_token")
    @patch.object(update_module, "get_tenant_url")
    async def test_handles_get_admin_token_error(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_request_error_handler,
        mock_http_client,
        mock_request_data_nickname,
    ):
        """Should handle error when getting admin token fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.side_effect = Exception("Token service error")

        await update_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data_nickname,
        )

        mock_request_error_handler.handle.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(update_module, "RequestErrorHandler")
    @patch.object(update_module, "verify_registration_ownership")
    @patch.object(update_module, "get_admin_token")
    @patch.object(update_module, "get_user_id_from_token")
    @patch.object(update_module, "get_tenant_url")
    async def test_handles_ownership_verification_failure(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_request_error_handler,
        mock_http_client,
        mock_request_data_nickname,
    ):
        """Should handle error when ownership verification fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_verify_registration_ownership.side_effect = HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not own this registration",
        )

        await update_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data_nickname,
        )

        mock_request_error_handler.handle.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(update_module, "RequestErrorHandler")
    @patch.object(update_module, "get_auth_request_headers")
    @patch.object(update_module, "verify_registration_ownership")
    @patch.object(update_module, "get_admin_token")
    @patch.object(update_module, "get_user_id_from_token")
    @patch.object(update_module, "get_tenant_url")
    async def test_handles_http_put_error(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_request_error_handler,
        mock_http_client,
        mock_request_data_nickname,
        mock_registration_data,
    ):
        """Should handle error when HTTP PUT request fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_verify_registration_ownership.return_value = mock_registration_data.copy()
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }

        mock_request = Request(
            "PUT",
            "https://tenant.verify.ibm.com/v2.0/factors/fido2/registrations/reg-123",
        )
        mock_response = Response(400, request=mock_request)
        mock_put_response = MagicMock()
        mock_put_response.raise_for_status.side_effect = HTTPStatusError(
            message="Bad Request",
            request=mock_request,
            response=mock_response,
        )
        mock_http_client.put = AsyncMock(return_value=mock_put_response)

        await update_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data_nickname,
        )

        mock_request_error_handler.handle.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(update_module, "RequestErrorHandler")
    @patch.object(update_module, "get_user_response")
    @patch.object(update_module, "get_auth_request_headers")
    @patch.object(update_module, "verify_registration_ownership")
    @patch.object(update_module, "get_admin_token")
    @patch.object(update_module, "get_user_id_from_token")
    @patch.object(update_module, "get_tenant_url")
    async def test_handles_get_user_response_error(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_get_user_response,
        mock_request_error_handler,
        mock_http_client,
        mock_request_data_nickname,
        mock_registration_data,
    ):
        """Should handle error when getting updated user response fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_verify_registration_ownership.return_value = mock_registration_data.copy()
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }

        mock_put_response = MagicMock()
        mock_put_response.raise_for_status = MagicMock()
        mock_http_client.put = AsyncMock(return_value=mock_put_response)

        mock_get_user_response.side_effect = Exception("Failed to get user response")

        await update_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data_nickname,
        )

        mock_request_error_handler.handle.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(update_module, "get_user_response")
    @patch.object(update_module, "get_auth_request_headers")
    @patch.object(update_module, "verify_registration_ownership")
    @patch.object(update_module, "get_admin_token")
    @patch.object(update_module, "get_user_id_from_token")
    @patch.object(update_module, "get_tenant_url")
    async def test_sets_required_fields_in_payload(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_get_user_response,
        mock_http_client,
        mock_request_data_nickname,
        mock_registration_data,
        mock_user_response,
    ):
        """Should set required id and userId fields in payload"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_verify_registration_ownership.return_value = mock_registration_data.copy()
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }
        mock_get_user_response.return_value = mock_user_response

        mock_put_response = MagicMock()
        mock_put_response.raise_for_status = MagicMock()
        mock_http_client.put = AsyncMock(return_value=mock_put_response)

        await update_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data_nickname,
        )

        call_kwargs = mock_http_client.put.call_args[1]
        payload = call_kwargs["json"]
        assert payload["id"] == "reg-123"
        assert payload["userId"] == "user-456"

    @pytest.mark.asyncio
    @patch.object(update_module, "get_user_response")
    @patch.object(update_module, "get_auth_request_headers")
    @patch.object(update_module, "verify_registration_ownership")
    @patch.object(update_module, "get_admin_token")
    @patch.object(update_module, "get_user_id_from_token")
    @patch.object(update_module, "get_tenant_url")
    async def test_preserves_existing_nickname_when_not_provided(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_get_user_response,
        mock_http_client,
        mock_request_data_enabled,
        mock_registration_data,
        mock_user_response,
    ):
        """Should preserve existing nickname when nickname is None"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_verify_registration_ownership.return_value = mock_registration_data.copy()
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }
        mock_get_user_response.return_value = mock_user_response

        mock_put_response = MagicMock()
        mock_put_response.raise_for_status = MagicMock()
        mock_http_client.put = AsyncMock(return_value=mock_put_response)

        await update_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data_enabled,
        )

        call_kwargs = mock_http_client.put.call_args[1]
        payload = call_kwargs["json"]
        # Original nickname should be preserved
        assert payload["attributes"]["nickname"] == "Old Passkey Name"

    @pytest.mark.asyncio
    @patch.object(update_module, "get_user_response")
    @patch.object(update_module, "get_auth_request_headers")
    @patch.object(update_module, "verify_registration_ownership")
    @patch.object(update_module, "get_admin_token")
    @patch.object(update_module, "get_user_id_from_token")
    @patch.object(update_module, "get_tenant_url")
    async def test_handles_registration_without_attributes(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_get_user_response,
        mock_http_client,
        mock_request_data_nickname,
        mock_user_response,
    ):
        """Should handle registration data without attributes"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        # Registration without attributes
        mock_verify_registration_ownership.return_value = {
            "id": "reg-123",
            "userId": "user-456",
            "enabled": True,
        }
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }
        mock_get_user_response.return_value = mock_user_response

        mock_put_response = MagicMock()
        mock_put_response.raise_for_status = MagicMock()
        mock_http_client.put = AsyncMock(return_value=mock_put_response)

        await update_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data_nickname,
        )

        call_kwargs = mock_http_client.put.call_args[1]
        payload = call_kwargs["json"]
        assert "attributes" in payload
        assert payload["attributes"]["nickname"] == "New Passkey Name"

    @pytest.mark.asyncio
    @patch.object(update_module, "get_user_response")
    @patch.object(update_module, "get_auth_request_headers")
    @patch.object(update_module, "verify_registration_ownership")
    @patch.object(update_module, "get_admin_token")
    @patch.object(update_module, "get_user_id_from_token")
    @patch.object(update_module, "get_tenant_url")
    async def test_uses_top_level_nickname_when_no_attribute_nickname(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_get_user_response,
        mock_http_client,
        mock_request_data_enabled,
        mock_user_response,
    ):
        """Should use top-level nickname when attributes.nickname is missing"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        # Registration with top-level nickname but not in attributes
        mock_verify_registration_ownership.return_value = {
            "id": "reg-123",
            "userId": "user-456",
            "nickname": "Top Level Name",
            "attributes": {},
        }
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }
        mock_get_user_response.return_value = mock_user_response

        mock_put_response = MagicMock()
        mock_put_response.raise_for_status = MagicMock()
        mock_http_client.put = AsyncMock(return_value=mock_put_response)

        await update_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data_enabled,
        )

        call_kwargs = mock_http_client.put.call_args[1]
        payload = call_kwargs["json"]
        assert payload["attributes"]["nickname"] == "Top Level Name"

    @pytest.mark.asyncio
    @patch.object(update_module, "RequestErrorHandler")
    @patch.object(update_module, "get_tenant_url")
    async def test_handles_generic_exception(
        self,
        mock_get_tenant_url,
        mock_request_error_handler,
        mock_http_client,
        mock_request_data_nickname,
    ):
        """Should handle any generic exception"""
        mock_get_tenant_url.side_effect = Exception("Unexpected error")

        await update_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data_nickname,
        )

        mock_request_error_handler.handle.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(update_module, "get_user_response")
    @patch.object(update_module, "get_auth_request_headers")
    @patch.object(update_module, "verify_registration_ownership")
    @patch.object(update_module, "get_admin_token")
    @patch.object(update_module, "get_user_id_from_token")
    @patch.object(update_module, "get_tenant_url")
    async def test_uses_admin_token_for_put_request(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_get_user_response,
        mock_http_client,
        mock_request_data_nickname,
        mock_registration_data,
        mock_user_response,
    ):
        """Should use admin token for the PUT request"""
        admin_token = "specific-admin-token"
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = admin_token
        mock_verify_registration_ownership.return_value = mock_registration_data.copy()
        mock_get_auth_request_headers.return_value = {
            "Authorization": f"Bearer {admin_token}"
        }
        mock_get_user_response.return_value = mock_user_response

        mock_put_response = MagicMock()
        mock_put_response.raise_for_status = MagicMock()
        mock_http_client.put = AsyncMock(return_value=mock_put_response)

        await update_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data_nickname,
        )

        mock_get_auth_request_headers.assert_called_once_with(
            admin_token, json_content_type=True
        )
