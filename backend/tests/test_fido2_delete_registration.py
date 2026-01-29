"""
Unit tests for FIDO2 delete_fido2_registration.py module

Tests the delete_registration function to achieve >80% code coverage.
Uses importlib to import the actual module for patching.
"""

import importlib
import pytest
from fastapi import HTTPException, status
from httpx import AsyncClient, HTTPStatusError, Request, Response
from unittest.mock import AsyncMock, MagicMock, patch

# Import the module using importlib to get the actual module object
delete_module = importlib.import_module("app.fido2.services.delete_fido2_registration")

# Import the function directly for testing
delete_registration = delete_module.delete_registration


class TestDeleteRegistration:
    """Tests for delete_registration function"""

    @pytest.fixture
    def mock_http_client(self):
        """Create a mock HTTP client"""
        client = AsyncMock(spec=AsyncClient)
        return client

    @pytest.fixture
    def mock_request_data(self):
        """Create mock request data with registration ID"""
        mock_data = MagicMock()
        mock_data.id = "registration-123"
        return mock_data

    @pytest.mark.asyncio
    @patch.object(delete_module, "get_auth_request_headers")
    @patch.object(delete_module, "verify_registration_ownership")
    @patch.object(delete_module, "get_admin_token")
    @patch.object(delete_module, "get_user_id_from_token")
    @patch.object(delete_module, "get_tenant_url")
    async def test_successful_deletion(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_http_client,
        mock_request_data,
    ):
        """Should successfully delete a registration and return ResponseModel"""
        # Setup mocks
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_verify_registration_ownership.return_value = (
            None  # No exception means ownership verified
        )
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }

        # Setup HTTP client mock for delete (204 No Content)
        mock_delete_response = MagicMock()
        mock_delete_response.status_code = 204
        mock_delete_response.raise_for_status = MagicMock()
        mock_http_client.delete = AsyncMock(return_value=mock_delete_response)

        # Execute
        result = await delete_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data,
        )

        # Verify
        assert result.success is True
        assert result.message == "FIDO2 registration deleted successfully"
        mock_get_tenant_url.assert_called_once()
        mock_get_user_id_from_token.assert_called_once_with(
            mock_http_client, "user-token-abc"
        )
        mock_get_admin_token.assert_called_once_with(mock_http_client)
        mock_verify_registration_ownership.assert_called_once_with(
            mock_http_client, "admin-token-xyz", "registration-123", "user-456"
        )
        mock_http_client.delete.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(delete_module, "get_auth_request_headers")
    @patch.object(delete_module, "verify_registration_ownership")
    @patch.object(delete_module, "get_admin_token")
    @patch.object(delete_module, "get_user_id_from_token")
    @patch.object(delete_module, "get_tenant_url")
    async def test_delete_calls_correct_endpoint(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_http_client,
        mock_request_data,
    ):
        """Should call the correct FIDO2 registrations endpoint with registration ID"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }

        mock_delete_response = MagicMock()
        mock_delete_response.status_code = 204
        mock_delete_response.raise_for_status = MagicMock()
        mock_http_client.delete = AsyncMock(return_value=mock_delete_response)

        await delete_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data,
        )

        # Verify the delete URL includes registration ID
        call_args = mock_http_client.delete.call_args
        delete_url = call_args[0][0]
        assert "registration-123" in delete_url
        assert "/v2.0/factors/fido2/registrations/" in delete_url

    @pytest.mark.asyncio
    @patch.object(delete_module, "RequestErrorHandler")
    @patch.object(delete_module, "get_user_id_from_token")
    @patch.object(delete_module, "get_tenant_url")
    async def test_handles_get_user_id_error(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_request_error_handler,
        mock_http_client,
        mock_request_data,
    ):
        """Should handle error when getting user ID from token fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.side_effect = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

        await delete_registration(
            http_client=mock_http_client,
            user_access_token="invalid-token",
            request_data=mock_request_data,
        )

        mock_request_error_handler.handle.assert_called_once()
        error_arg = mock_request_error_handler.handle.call_args[0][0]
        assert isinstance(error_arg, HTTPException)
        assert error_arg.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    @patch.object(delete_module, "RequestErrorHandler")
    @patch.object(delete_module, "get_admin_token")
    @patch.object(delete_module, "get_user_id_from_token")
    @patch.object(delete_module, "get_tenant_url")
    async def test_handles_get_admin_token_error(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_request_error_handler,
        mock_http_client,
        mock_request_data,
    ):
        """Should handle error when getting admin token fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.side_effect = HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Token service unavailable",
        )

        await delete_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data,
        )

        mock_request_error_handler.handle.assert_called_once()
        error_arg = mock_request_error_handler.handle.call_args[0][0]
        assert isinstance(error_arg, HTTPException)

    @pytest.mark.asyncio
    @patch.object(delete_module, "RequestErrorHandler")
    @patch.object(delete_module, "verify_registration_ownership")
    @patch.object(delete_module, "get_admin_token")
    @patch.object(delete_module, "get_user_id_from_token")
    @patch.object(delete_module, "get_tenant_url")
    async def test_handles_ownership_verification_failure(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_request_error_handler,
        mock_http_client,
        mock_request_data,
    ):
        """Should handle error when registration ownership verification fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_verify_registration_ownership.side_effect = HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not own this registration",
        )

        await delete_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data,
        )

        mock_request_error_handler.handle.assert_called_once()
        error_arg = mock_request_error_handler.handle.call_args[0][0]
        assert isinstance(error_arg, HTTPException)
        assert error_arg.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    @patch.object(delete_module, "RequestErrorHandler")
    @patch.object(delete_module, "get_auth_request_headers")
    @patch.object(delete_module, "verify_registration_ownership")
    @patch.object(delete_module, "get_admin_token")
    @patch.object(delete_module, "get_user_id_from_token")
    @patch.object(delete_module, "get_tenant_url")
    async def test_handles_http_delete_error(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_request_error_handler,
        mock_http_client,
        mock_request_data,
    ):
        """Should handle error when HTTP delete request fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }

        # Simulate HTTP error on delete
        mock_request = Request(
            "DELETE",
            "https://tenant.verify.ibm.com/v2.0/factors/fido2/registrations/reg-123",
        )
        mock_response = Response(404, request=mock_request)
        mock_delete_response = MagicMock()
        mock_delete_response.raise_for_status.side_effect = HTTPStatusError(
            message="Not Found",
            request=mock_request,
            response=mock_response,
        )
        mock_http_client.delete = AsyncMock(return_value=mock_delete_response)

        await delete_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data,
        )

        mock_request_error_handler.handle.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(delete_module, "get_auth_request_headers")
    @patch.object(delete_module, "verify_registration_ownership")
    @patch.object(delete_module, "get_admin_token")
    @patch.object(delete_module, "get_user_id_from_token")
    @patch.object(delete_module, "get_tenant_url")
    async def test_passes_correct_headers_to_delete(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_http_client,
        mock_request_data,
    ):
        """Should pass correct headers from get_auth_request_headers to delete request"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        expected_headers = {
            "Authorization": "Bearer admin-token-xyz",
            "Content-Type": "application/json",
        }
        mock_get_auth_request_headers.return_value = expected_headers

        mock_delete_response = MagicMock()
        mock_delete_response.status_code = 204
        mock_delete_response.raise_for_status = MagicMock()
        mock_http_client.delete = AsyncMock(return_value=mock_delete_response)

        await delete_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data,
        )

        # Verify headers were passed correctly
        mock_get_auth_request_headers.assert_called_once_with(
            "admin-token-xyz", json_content_type=True
        )
        call_kwargs = mock_http_client.delete.call_args[1]
        assert call_kwargs["headers"] == expected_headers

    @pytest.mark.asyncio
    @patch.object(delete_module, "RequestErrorHandler")
    @patch.object(delete_module, "get_tenant_url")
    async def test_handles_generic_exception(
        self,
        mock_get_tenant_url,
        mock_request_error_handler,
        mock_http_client,
        mock_request_data,
    ):
        """Should handle any generic exception and call error handler"""
        mock_get_tenant_url.side_effect = Exception("Unexpected error")

        await delete_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data,
        )

        mock_request_error_handler.handle.assert_called_once()
        error_arg = mock_request_error_handler.handle.call_args[0][0]
        assert isinstance(error_arg, Exception)
        assert "Unexpected error" in str(error_arg)

    @pytest.mark.asyncio
    @patch.object(delete_module, "get_auth_request_headers")
    @patch.object(delete_module, "verify_registration_ownership")
    @patch.object(delete_module, "get_admin_token")
    @patch.object(delete_module, "get_user_id_from_token")
    @patch.object(delete_module, "get_tenant_url")
    async def test_uses_user_access_token_for_user_id(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_http_client,
        mock_request_data,
    ):
        """Should use user access token for getting user ID"""
        user_token = "specific-user-token"
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }

        mock_delete_response = MagicMock()
        mock_delete_response.status_code = 204
        mock_delete_response.raise_for_status = MagicMock()
        mock_http_client.delete = AsyncMock(return_value=mock_delete_response)

        await delete_registration(
            http_client=mock_http_client,
            user_access_token=user_token,
            request_data=mock_request_data,
        )

        # Verify user token is used for getting user ID
        mock_get_user_id_from_token.assert_called_once_with(
            mock_http_client, user_token
        )

    @pytest.mark.asyncio
    @patch.object(delete_module, "get_auth_request_headers")
    @patch.object(delete_module, "verify_registration_ownership")
    @patch.object(delete_module, "get_admin_token")
    @patch.object(delete_module, "get_user_id_from_token")
    @patch.object(delete_module, "get_tenant_url")
    async def test_different_registration_ids(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should handle different registration ID formats"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }

        mock_delete_response = MagicMock()
        mock_delete_response.status_code = 204
        mock_delete_response.raise_for_status = MagicMock()
        mock_http_client.delete = AsyncMock(return_value=mock_delete_response)

        # Test with UUID-style registration ID
        mock_request_data = MagicMock()
        mock_request_data.id = "550e8400-e29b-41d4-a716-446655440000"

        await delete_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data,
        )

        call_args = mock_http_client.delete.call_args
        delete_url = call_args[0][0]
        assert "550e8400-e29b-41d4-a716-446655440000" in delete_url
        mock_verify_registration_ownership.assert_called_with(
            mock_http_client,
            "admin-token-xyz",
            "550e8400-e29b-41d4-a716-446655440000",
            "user-456",
        )

    @pytest.mark.asyncio
    @patch.object(delete_module, "RequestErrorHandler")
    @patch.object(delete_module, "get_auth_request_headers")
    @patch.object(delete_module, "verify_registration_ownership")
    @patch.object(delete_module, "get_admin_token")
    @patch.object(delete_module, "get_user_id_from_token")
    @patch.object(delete_module, "get_tenant_url")
    async def test_handles_connection_error(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_request_error_handler,
        mock_http_client,
        mock_request_data,
    ):
        """Should handle connection errors during delete request"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }

        # Simulate connection error
        mock_http_client.delete = AsyncMock(
            side_effect=ConnectionError("Connection refused")
        )

        await delete_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data,
        )

        mock_request_error_handler.handle.assert_called_once()
        error_arg = mock_request_error_handler.handle.call_args[0][0]
        assert isinstance(error_arg, ConnectionError)

    @pytest.mark.asyncio
    @patch.object(delete_module, "get_auth_request_headers")
    @patch.object(delete_module, "verify_registration_ownership")
    @patch.object(delete_module, "get_admin_token")
    @patch.object(delete_module, "get_user_id_from_token")
    @patch.object(delete_module, "get_tenant_url")
    async def test_returns_response_model_with_no_data(
        self,
        mock_get_tenant_url,
        mock_get_user_id_from_token,
        mock_get_admin_token,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_http_client,
        mock_request_data,
    ):
        """Should return ResponseModel with success=True and no data (204 No Content)"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_id_from_token.return_value = "user-456"
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }

        mock_delete_response = MagicMock()
        mock_delete_response.status_code = 204
        mock_delete_response.raise_for_status = MagicMock()
        mock_http_client.delete = AsyncMock(return_value=mock_delete_response)

        result = await delete_registration(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data,
        )

        # Verify ResponseModel structure (204 No Content means no data)
        assert result.success is True
        assert result.message == "FIDO2 registration deleted successfully"
        assert result.data is None
