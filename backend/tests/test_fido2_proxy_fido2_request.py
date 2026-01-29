"""
Unit tests for FIDO2 proxy_fido2_request.py module

Tests all functions to achieve >80% code coverage.
Uses importlib to import the actual module for patching.
"""

import importlib
import pytest
from fastapi import HTTPException, status
from httpx import AsyncClient
from unittest.mock import AsyncMock, MagicMock, patch

# Import the module using importlib to get the actual module object
# (not the re-exported function from __init__.py)
proxy_module = importlib.import_module("app.fido2.services.proxy_fido2_request")

# Import functions directly for testing
_validate_authentication = proxy_module._validate_authentication
_prepare_request_body = proxy_module._prepare_request_body
_prepare_attestation_result_body = proxy_module._prepare_attestation_result_body
_handle_error_response = proxy_module._handle_error_response
proxy_fido2_request_fn = proxy_module.proxy_fido2_request


class TestValidateAuthentication:
    """Tests for _validate_authentication function"""

    @pytest.mark.asyncio
    async def test_validate_authentication_with_user_id(self):
        """Should pass when user_id is provided"""
        # No exception should be raised
        await _validate_authentication(
            user_id="user-123",
            request_body={"username": "testuser"},
            validate_username=True,
            allow_empty_username=False,
        )

    @pytest.mark.asyncio
    async def test_validate_authentication_skip_validation(self):
        """Should pass when validate_username is False"""
        await _validate_authentication(
            user_id=None,
            request_body={"username": "testuser"},
            validate_username=False,
            allow_empty_username=False,
        )

    @pytest.mark.asyncio
    async def test_validate_authentication_allow_empty_username(self):
        """Should pass when allow_empty_username is True and username is empty"""
        await _validate_authentication(
            user_id=None,
            request_body={"username": ""},
            validate_username=True,
            allow_empty_username=True,
        )

    @pytest.mark.asyncio
    async def test_validate_authentication_raises_unauthorized(self):
        """Should raise HTTPException when user_id is None and validation required"""
        with pytest.raises(HTTPException) as exc:
            await _validate_authentication(
                user_id=None,
                request_body={"username": "testuser"},
                validate_username=True,
                allow_empty_username=False,
            )
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc.value.detail == "Not authenticated"

    @pytest.mark.asyncio
    async def test_validate_authentication_no_request_body(self):
        """Should handle None request_body"""
        with pytest.raises(HTTPException) as exc:
            await _validate_authentication(
                user_id=None,
                request_body=None,
                validate_username=True,
                allow_empty_username=False,
            )
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED


class TestPrepareAttestationResultBody:
    """Tests for _prepare_attestation_result_body function"""

    def test_adds_enabled_true(self):
        """Should add enabled: true to body"""
        body = {"data": "test"}
        result = _prepare_attestation_result_body(body)
        assert result["enabled"] is True

    def test_sets_empty_client_extension_results_when_none(self):
        """Should set getClientExtensionResults to empty dict if None"""
        body = {"getClientExtensionResults": None}
        result = _prepare_attestation_result_body(body)
        assert result["getClientExtensionResults"] == {}

    def test_preserves_existing_client_extension_results(self):
        """Should preserve existing getClientExtensionResults"""
        body = {"getClientExtensionResults": {"key": "value"}}
        result = _prepare_attestation_result_body(body)
        assert result["getClientExtensionResults"] == {"key": "value"}

    def test_modifies_original_dict(self):
        """Verify the function modifies and returns the same dict"""
        body = {"data": "test", "getClientExtensionResults": None}
        result = _prepare_attestation_result_body(body)
        assert result is body
        assert result["enabled"] is True
        assert result["getClientExtensionResults"] == {}


class TestHandleErrorResponse:
    """Tests for _handle_error_response function"""

    def test_handles_ibm_verify_error_format(self):
        """Should handle IBM Verify error format with success=False"""
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.headers = {}
        mock_response.text = '{"success": false, "message": "Invalid request"}'
        mock_response.json.return_value = {
            "success": False,
            "message": "Invalid request",
        }

        result = _handle_error_response(mock_response)
        assert result["status"] == "failed"
        assert result["errorMessage"] == "Invalid request"

    def test_handles_ci_style_error_format(self):
        """Should handle CI-style error format with error.messageId"""
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.headers = {}
        mock_response.text = '{"error": {"messageId": "CSIW0001", "messageDescription": "Error occurred"}}'
        mock_response.json.return_value = {
            "error": {"messageId": "CSIW0001", "messageDescription": "Error occurred"}
        }

        result = _handle_error_response(mock_response)
        assert result["status"] == "failed"
        assert "CSIW0001" in result["errorMessage"]
        assert "Error occurred" in result["errorMessage"]

    def test_handles_generic_error_response(self):
        """Should handle generic error response"""
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.headers = {}
        mock_response.text = '{"unknown": "format"}'
        mock_response.json.return_value = {"unknown": "format"}

        result = _handle_error_response(mock_response)
        assert result["status"] == "failed"
        assert "500" in result["errorMessage"]

    def test_handles_json_parse_failure(self):
        """Should handle JSON parsing failure"""
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.headers = {}
        mock_response.text = "Not valid JSON"
        mock_response.json.side_effect = Exception("JSON parse error")

        result = _handle_error_response(mock_response)
        assert result["status"] == "failed"
        assert "500" in result["errorMessage"]

    def test_handles_success_false_without_message(self):
        """Should handle success=False but missing message"""
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.headers = {}
        mock_response.text = '{"success": false}'
        mock_response.json.return_value = {"success": False}

        result = _handle_error_response(mock_response)
        assert result["status"] == "failed"
        # Falls through to generic error since no message key
        assert "400" in result["errorMessage"]

    def test_handles_error_object_without_messageid(self):
        """Should handle error object without messageId"""
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.headers = {}
        mock_response.text = '{"error": {"description": "Some error"}}'
        mock_response.json.return_value = {"error": {"description": "Some error"}}

        result = _handle_error_response(mock_response)
        assert result["status"] == "failed"
        # Falls through to generic error
        assert "400" in result["errorMessage"]


class TestPrepareRequestBody:
    """Tests for _prepare_request_body function"""

    @pytest.mark.asyncio
    async def test_copies_request_body(self):
        """Should copy request body without modifying original"""
        original = {"key": "value", "username": "test"}
        result = await _prepare_request_body(
            http_client=None,
            user_access_token=None,
            endpoint_path="/authentication",
            request_body=original,
            user_id="user-123",
        )
        # Original should still have username
        assert "username" in original
        # Result should have userId instead of username
        assert "username" not in result
        assert "userId" in result

    @pytest.mark.asyncio
    async def test_handles_none_request_body(self):
        """Should handle None request_body"""
        result = await _prepare_request_body(
            http_client=None,
            user_access_token=None,
            endpoint_path="/authentication",
            request_body=None,
            user_id=None,
        )
        assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_removes_username_without_user_id(self):
        """Should remove username when no user_id provided"""
        result = await _prepare_request_body(
            http_client=None,
            user_access_token=None,
            endpoint_path="/authentication",
            request_body={"username": "test"},
            user_id=None,
        )
        assert "username" not in result
        assert "userId" not in result

    @pytest.mark.asyncio
    async def test_attestation_result_does_not_add_user_id(self):
        """Should not add userId for attestation/result endpoint"""
        result = await _prepare_request_body(
            http_client=None,
            user_access_token=None,
            endpoint_path="/attestation/result",
            request_body={"username": "test"},
            user_id="user-123",
        )
        # For attestation/result, userId should NOT be added (per code logic)
        assert "userId" not in result
        # It should have enabled=True from _prepare_attestation_result_body
        assert result.get("enabled") is True

    @pytest.mark.asyncio
    @patch.object(proxy_module, "get_user_profile_info")
    async def test_attestation_options_injects_user_profile(
        self, mock_get_user_profile_info
    ):
        """Should inject user profile for attestation/options endpoint"""
        mock_get_user_profile_info.return_value = ("user@example.com", "Test User")
        mock_client = AsyncMock(spec=AsyncClient)

        result = await _prepare_request_body(
            http_client=mock_client,
            user_access_token="user-token",
            endpoint_path="/attestation/options",
            request_body={"some": "data"},
            user_id="user-123",
        )

        mock_get_user_profile_info.assert_called_once_with(mock_client, "user-token")
        # Username is replaced with userId, displayName should be in body
        assert result.get("displayName") == "Test User"
        assert result.get("userId") == "user-123"

    @pytest.mark.asyncio
    async def test_attestation_options_without_user_token(self):
        """Should skip user profile injection when no user token"""
        result = await _prepare_request_body(
            http_client=None,
            user_access_token=None,
            endpoint_path="/attestation/options",
            request_body={"username": "test"},
            user_id="user-123",
        )
        # Without user token, profile injection should be skipped
        assert "displayName" not in result

    @pytest.mark.asyncio
    async def test_preserves_non_username_fields(self):
        """Should preserve other fields in request body"""
        result = await _prepare_request_body(
            http_client=None,
            user_access_token=None,
            endpoint_path="/authentication",
            request_body={"username": "test", "challenge": "abc123", "other": "data"},
            user_id="user-123",
        )
        assert result.get("challenge") == "abc123"
        assert result.get("other") == "data"
        assert result.get("userId") == "user-123"


class TestProxyFido2Request:
    """Tests for main proxy_fido2_request function"""

    @pytest.mark.asyncio
    @patch.object(proxy_module, "get_auth_request_headers")
    @patch.object(proxy_module, "get_user_id_from_token")
    @patch.object(proxy_module, "get_rp_uuid_from_rp_id")
    @patch.object(proxy_module, "get_admin_token")
    @patch.object(proxy_module, "get_rp_id")
    @patch.object(proxy_module, "get_tenant_url")
    async def test_successful_authentication_request(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_id_from_token,
        mock_get_auth_request_headers,
    ):
        """Should successfully proxy a FIDO2 authentication request"""
        # Setup mocks
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_user_id_from_token.return_value = "user-id-456"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token",
            "Content-Type": "application/json",
        }

        # Create mock http client
        mock_client = AsyncMock(spec=AsyncClient)
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"challenge": "abc123", "status": "ok"}
        mock_client.post.return_value = mock_response

        # Execute
        result = await proxy_fido2_request_fn(
            http_client=mock_client,
            user_access_token="user-token",
            endpoint_path="/assertion/options",
            request_body={"username": "testuser"},
            validate_username=True,
            allow_empty_username=False,
        )

        # Verify
        assert result.success is True
        assert result.data["challenge"] == "abc123"
        mock_get_admin_token.assert_called_once()
        mock_get_rp_uuid_from_rp_id.assert_called_once()
        mock_get_user_id_from_token.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(proxy_module, "get_auth_request_headers")
    @patch.object(proxy_module, "get_user_id_from_token")
    @patch.object(proxy_module, "get_rp_uuid_from_rp_id")
    @patch.object(proxy_module, "get_admin_token")
    @patch.object(proxy_module, "get_rp_id")
    @patch.object(proxy_module, "get_tenant_url")
    async def test_handles_api_error_response(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_id_from_token,
        mock_get_auth_request_headers,
    ):
        """Should handle API error response and raise HTTPException"""
        # Setup mocks
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_user_id_from_token.return_value = "user-id-456"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        # Create mock http client with error response
        mock_client = AsyncMock(spec=AsyncClient)
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.headers = {}
        mock_response.text = '{"success": false, "message": "Bad request"}'
        mock_response.json.return_value = {"success": False, "message": "Bad request"}
        mock_client.post.return_value = mock_response

        # Execute and verify exception
        with pytest.raises(HTTPException) as exc:
            await proxy_fido2_request_fn(
                http_client=mock_client,
                user_access_token="user-token",
                endpoint_path="/assertion/options",
                request_body={"username": "testuser"},
            )

        assert exc.value.status_code == 400
        assert exc.value.detail["status"] == "failed"

    @pytest.mark.asyncio
    @patch.object(proxy_module, "get_admin_token")
    @patch.object(proxy_module, "get_rp_id")
    @patch.object(proxy_module, "get_tenant_url")
    async def test_propagates_admin_token_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
    ):
        """Should propagate HTTPException from get_admin_token"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.side_effect = HTTPException(
            status_code=500, detail="Failed to get admin token"
        )

        mock_client = AsyncMock(spec=AsyncClient)

        with pytest.raises(HTTPException) as exc:
            await proxy_fido2_request_fn(
                http_client=mock_client,
                user_access_token="user-token",
                endpoint_path="/assertion/options",
                request_body={"username": "testuser"},
            )

        assert exc.value.status_code == 500

    @pytest.mark.asyncio
    @patch.object(proxy_module, "get_rp_uuid_from_rp_id")
    @patch.object(proxy_module, "get_admin_token")
    @patch.object(proxy_module, "get_rp_id")
    @patch.object(proxy_module, "get_tenant_url")
    async def test_propagates_rp_uuid_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
    ):
        """Should propagate HTTPException from get_rp_uuid_from_rp_id"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.side_effect = HTTPException(
            status_code=404, detail="RP not found"
        )

        mock_client = AsyncMock(spec=AsyncClient)

        with pytest.raises(HTTPException) as exc:
            await proxy_fido2_request_fn(
                http_client=mock_client,
                user_access_token="user-token",
                endpoint_path="/assertion/options",
                request_body={"username": "testuser"},
            )

        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    @patch.object(proxy_module, "get_auth_request_headers")
    @patch.object(proxy_module, "get_rp_uuid_from_rp_id")
    @patch.object(proxy_module, "get_admin_token")
    @patch.object(proxy_module, "get_rp_id")
    @patch.object(proxy_module, "get_tenant_url")
    async def test_request_without_user_token(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
    ):
        """Should work without user access token (skip user ID lookup)"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_client = AsyncMock(spec=AsyncClient)
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"challenge": "abc123"}
        mock_client.post.return_value = mock_response

        # Use allow_empty_username to avoid authentication error
        result = await proxy_fido2_request_fn(
            http_client=mock_client,
            user_access_token=None,
            endpoint_path="/assertion/options",
            request_body={"username": ""},
            validate_username=True,
            allow_empty_username=True,
        )

        assert result.success is True

    @pytest.mark.asyncio
    @patch.object(proxy_module, "RequestErrorHandler")
    @patch.object(proxy_module, "get_admin_token")
    @patch.object(proxy_module, "get_rp_id")
    @patch.object(proxy_module, "get_tenant_url")
    async def test_handles_unexpected_exception(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_request_error_handler,
    ):
        """Should handle unexpected exceptions via RequestErrorHandler"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.side_effect = RuntimeError("Unexpected error")

        mock_client = AsyncMock(spec=AsyncClient)

        # Call the function (RequestErrorHandler.handle will be invoked)
        await proxy_fido2_request_fn(
            http_client=mock_client,
            user_access_token="user-token",
            endpoint_path="/assertion/options",
            request_body={"username": "testuser"},
        )

        # Verify RequestErrorHandler.handle was called
        mock_request_error_handler.handle.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(proxy_module, "get_user_id_from_token")
    @patch.object(proxy_module, "get_rp_uuid_from_rp_id")
    @patch.object(proxy_module, "get_admin_token")
    @patch.object(proxy_module, "get_rp_id")
    @patch.object(proxy_module, "get_tenant_url")
    async def test_authentication_validation_fails(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_id_from_token,
    ):
        """Should raise HTTPException when authentication validation fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        # Return None user_id to trigger authentication failure
        mock_get_user_id_from_token.return_value = None

        mock_client = AsyncMock(spec=AsyncClient)

        with pytest.raises(HTTPException) as exc:
            await proxy_fido2_request_fn(
                http_client=mock_client,
                user_access_token="user-token",
                endpoint_path="/assertion/options",
                request_body={"username": "testuser"},
                validate_username=True,
                allow_empty_username=False,
            )

        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    @patch.object(proxy_module, "get_auth_request_headers")
    @patch.object(proxy_module, "get_user_id_from_token")
    @patch.object(proxy_module, "get_rp_uuid_from_rp_id")
    @patch.object(proxy_module, "get_admin_token")
    @patch.object(proxy_module, "get_rp_id")
    @patch.object(proxy_module, "get_tenant_url")
    async def test_attestation_result_endpoint(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_id_from_token,
        mock_get_auth_request_headers,
    ):
        """Should handle attestation/result endpoint specifically"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_user_id_from_token.return_value = "user-id-456"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_client = AsyncMock(spec=AsyncClient)
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok"}
        mock_client.post.return_value = mock_response

        result = await proxy_fido2_request_fn(
            http_client=mock_client,
            user_access_token="user-token",
            endpoint_path="/attestation/result",
            request_body={
                "id": "credential-id",
                "getClientExtensionResults": None,
            },
        )

        assert result.success is True
        # Verify the post was called
        mock_client.post.assert_called_once()
        # The body should have enabled=True and getClientExtensionResults={}
        call_args = mock_client.post.call_args
        sent_body = call_args.kwargs.get("json", {})
        assert sent_body.get("enabled") is True
        assert sent_body.get("getClientExtensionResults") == {}

    @pytest.mark.asyncio
    @patch.object(proxy_module, "get_user_profile_info")
    @patch.object(proxy_module, "get_auth_request_headers")
    @patch.object(proxy_module, "get_user_id_from_token")
    @patch.object(proxy_module, "get_rp_uuid_from_rp_id")
    @patch.object(proxy_module, "get_admin_token")
    @patch.object(proxy_module, "get_rp_id")
    @patch.object(proxy_module, "get_tenant_url")
    async def test_attestation_options_endpoint(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_id_from_token,
        mock_get_auth_request_headers,
        mock_get_user_profile_info,
    ):
        """Should handle attestation/options endpoint with profile injection"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_user_id_from_token.return_value = "user-id-456"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }
        mock_get_user_profile_info.return_value = ("user@example.com", "Test User")

        mock_client = AsyncMock(spec=AsyncClient)
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"challenge": "abc123"}
        mock_client.post.return_value = mock_response

        result = await proxy_fido2_request_fn(
            http_client=mock_client,
            user_access_token="user-token",
            endpoint_path="/attestation/options",
            request_body={},
        )

        assert result.success is True
        mock_get_user_profile_info.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(proxy_module, "get_auth_request_headers")
    @patch.object(proxy_module, "get_rp_uuid_from_rp_id")
    @patch.object(proxy_module, "get_admin_token")
    @patch.object(proxy_module, "get_rp_id")
    @patch.object(proxy_module, "get_tenant_url")
    async def test_skip_username_validation(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
    ):
        """Should skip username validation when validate_username=False"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_client = AsyncMock(spec=AsyncClient)
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok"}
        mock_client.post.return_value = mock_response

        # No user_access_token but validate_username=False should work
        result = await proxy_fido2_request_fn(
            http_client=mock_client,
            user_access_token=None,
            endpoint_path="/assertion/options",
            request_body={"username": "testuser"},
            validate_username=False,
            allow_empty_username=False,
        )

        assert result.success is True
