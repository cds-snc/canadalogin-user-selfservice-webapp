"""
Unit tests for FIDO2 delete_fido2_registration.py module

Tests the delete_registration function to achieve >80% code coverage.
Uses importlib to import the actual module for patching.
"""

import importlib
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, MagicMock, patch

# Import the module using importlib to get the actual module object
delete_module = importlib.import_module("app.fido2.services.delete_fido2_registration")

# Import the function directly for testing
delete_registration = delete_module.delete_registration


class TestDeleteRegistration:
    """Tests for delete_registration function"""

    @pytest.fixture
    def mock_request(self):
        """Create a mock FastAPI Request object"""
        mock_req = MagicMock()
        mock_req.session = {}
        return mock_req

    @pytest.fixture
    def mock_http_client(self):
        """Create a mock HTTP client"""
        client = AsyncMock(spec=AsyncClient)
        return client

    @pytest.fixture
    def mock_request_data(self):
        """Create mock request data with registration ID and assertion result"""
        mock_data = MagicMock()
        mock_data.id = "registration-123"
        mock_data.assertionResult = MagicMock()  # Mock assertion result
        return mock_data

    @pytest.mark.asyncio
    @patch.object(delete_module, "submit_assertion_result")
    @patch.object(delete_module, "get_auth_request_headers")
    @patch.object(delete_module, "verify_registration_ownership")
    @patch.object(delete_module, "get_user_profile_info")
    @patch.object(delete_module, "get_tenant_url")
    async def test_successful_deletion(
        self,
        mock_get_tenant_url,
        mock_get_user_profile_info,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_submit_assertion_result,
        mock_http_client,
        mock_request_data,
        mock_request,
    ):
        """Should successfully delete a registration and return ResponseModel"""
        # Setup mocks
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_verify_registration_ownership.return_value = (
            None  # No exception means ownership verified
        )
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer user-token-abc"
        }

        # Mock FIDO2 assertion verification success
        mock_assertion_response = MagicMock()
        mock_assertion_response.success = True
        mock_submit_assertion_result.return_value = mock_assertion_response

        # Setup HTTP client mock for delete (204 No Content)
        mock_delete_response = MagicMock()
        mock_delete_response.status_code = 204
        mock_delete_response.raise_for_status = MagicMock()
        mock_http_client.delete = AsyncMock(return_value=mock_delete_response)

        # Execute
        result = await delete_registration(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data,
        )

        # Verify
        assert result.success is True
        assert result.message == "FIDO2 registration deleted successfully"
        mock_submit_assertion_result.assert_called_once()
        mock_get_tenant_url.assert_called_once()
        mock_get_user_profile_info.assert_called_once_with(
            mock_http_client, "user-token-abc"
        )
        mock_verify_registration_ownership.assert_called_once_with(
            mock_http_client, "user-token-abc", "registration-123", "user-456"
        )
        mock_http_client.delete.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(delete_module, "submit_assertion_result")
    @patch.object(delete_module, "get_auth_request_headers")
    @patch.object(delete_module, "verify_registration_ownership")
    @patch.object(delete_module, "get_user_profile_info")
    @patch.object(delete_module, "get_tenant_url")
    async def test_delete_calls_correct_endpoint(
        self,
        mock_get_tenant_url,
        mock_get_user_profile_info,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_submit_assertion_result,
        mock_http_client,
        mock_request_data,
        mock_request,
    ):
        """Should call the correct FIDO2 registrations endpoint with registration ID"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer user-token-abc"
        }

        mock_assertion_response = MagicMock()
        mock_assertion_response.success = True
        mock_submit_assertion_result.return_value = mock_assertion_response

        mock_delete_response = MagicMock()
        mock_delete_response.status_code = 204
        mock_delete_response.raise_for_status = MagicMock()
        mock_http_client.delete = AsyncMock(return_value=mock_delete_response)

        await delete_registration(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data,
        )

        # Verify the delete URL includes registration ID
        call_args = mock_http_client.delete.call_args[0]
        delete_url = call_args[0]
        assert "registration-123" in delete_url
        assert "/v2.0/factors/fido2/registrations/" in delete_url

    @pytest.mark.asyncio
    @patch.object(delete_module, "submit_assertion_result")
    @patch.object(delete_module, "get_auth_request_headers")
    @patch.object(delete_module, "verify_registration_ownership")
    @patch.object(delete_module, "get_user_profile_info")
    @patch.object(delete_module, "get_tenant_url")
    async def test_passes_correct_headers_to_delete(
        self,
        mock_get_tenant_url,
        mock_get_user_profile_info,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_submit_assertion_result,
        mock_http_client,
        mock_request_data,
        mock_request,
    ):
        """Should pass correct headers from get_auth_request_headers to delete request"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"

        mock_assertion_response = MagicMock()
        mock_assertion_response.success = True
        mock_submit_assertion_result.return_value = mock_assertion_response

        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        expected_headers = {
            "Authorization": "Bearer user-token-abc",
            "Content-Type": "application/json",
        }
        mock_get_auth_request_headers.return_value = expected_headers

        mock_delete_response = MagicMock()
        mock_delete_response.status_code = 204
        mock_delete_response.raise_for_status = MagicMock()
        mock_http_client.delete = AsyncMock(return_value=mock_delete_response)

        await delete_registration(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data,
        )

        # Verify headers were passed correctly
        mock_get_auth_request_headers.assert_called_once_with(
            "user-token-abc", json_content_type=True
        )
        call_kwargs = mock_http_client.delete.call_args[1]
        assert call_kwargs["headers"] == expected_headers

    @pytest.mark.asyncio
    @patch.object(delete_module, "submit_assertion_result")
    @patch.object(delete_module, "get_auth_request_headers")
    @patch.object(delete_module, "verify_registration_ownership")
    @patch.object(delete_module, "get_user_profile_info")
    @patch.object(delete_module, "get_tenant_url")
    async def test_uses_user_access_token_for_user_id(
        self,
        mock_get_tenant_url,
        mock_get_user_profile_info,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_submit_assertion_result,
        mock_http_client,
        mock_request_data,
        mock_request,
    ):
        """Should use user access token for getting user profile"""
        user_token = "specific-user-token"
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"

        mock_assertion_response = MagicMock()
        mock_assertion_response.success = True
        mock_submit_assertion_result.return_value = mock_assertion_response

        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer specific-user-token"
        }

        mock_delete_response = MagicMock()
        mock_delete_response.status_code = 204
        mock_delete_response.raise_for_status = MagicMock()
        mock_http_client.delete = AsyncMock(return_value=mock_delete_response)

        await delete_registration(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token=user_token,
            request_data=mock_request_data,
        )

        # Verify user token is used for getting user profile
        mock_get_user_profile_info.assert_called_once_with(mock_http_client, user_token)

    @pytest.mark.asyncio
    @patch.object(delete_module, "submit_assertion_result")
    @patch.object(delete_module, "get_auth_request_headers")
    @patch.object(delete_module, "verify_registration_ownership")
    @patch.object(delete_module, "get_user_profile_info")
    @patch.object(delete_module, "get_tenant_url")
    async def test_different_registration_ids(
        self,
        mock_get_tenant_url,
        mock_get_user_profile_info,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_submit_assertion_result,
        mock_http_client,
        mock_request,
    ):
        """Should handle different registration ID formats"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"

        mock_assertion_response = MagicMock()
        mock_assertion_response.success = True
        mock_submit_assertion_result.return_value = mock_assertion_response

        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer user-token-abc"
        }

        mock_delete_response = MagicMock()
        mock_delete_response.status_code = 204
        mock_delete_response.raise_for_status = MagicMock()
        mock_http_client.delete = AsyncMock(return_value=mock_delete_response)

        # Test with UUID-style registration ID
        mock_request_data = MagicMock()
        mock_request_data.id = "550e8400-e29b-41d4-a716-446655440000"
        mock_request_data.assertionResult = MagicMock()

        await delete_registration(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data,
        )

        call_args = mock_http_client.delete.call_args[0]
        delete_url = call_args[0]
        assert "550e8400-e29b-41d4-a716-446655440000" in delete_url
        mock_verify_registration_ownership.assert_called_with(
            mock_http_client,
            "user-token-abc",
            "550e8400-e29b-41d4-a716-446655440000",
            "user-456",
        )

    @pytest.mark.asyncio
    @patch.object(delete_module, "submit_assertion_result")
    @patch.object(delete_module, "get_auth_request_headers")
    @patch.object(delete_module, "verify_registration_ownership")
    @patch.object(delete_module, "get_user_profile_info")
    @patch.object(delete_module, "get_tenant_url")
    async def test_returns_response_model_with_no_data(
        self,
        mock_get_tenant_url,
        mock_get_user_profile_info,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_submit_assertion_result,
        mock_http_client,
        mock_request_data,
        mock_request,
    ):
        """Should return ResponseModel with success=True and no data (204 No Content)"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"

        mock_assertion_response = MagicMock()
        mock_assertion_response.success = True
        mock_submit_assertion_result.return_value = mock_assertion_response

        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer user-token-abc"
        }

        mock_delete_response = MagicMock()
        mock_delete_response.status_code = 204
        mock_delete_response.raise_for_status = MagicMock()
        mock_http_client.delete = AsyncMock(return_value=mock_delete_response)

        result = await delete_registration(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token-abc",
            request_data=mock_request_data,
        )

        # Verify ResponseModel structure (204 No Content means no data)
        assert result.success is True
        assert result.message == "FIDO2 registration deleted successfully"
        assert result.data is None
