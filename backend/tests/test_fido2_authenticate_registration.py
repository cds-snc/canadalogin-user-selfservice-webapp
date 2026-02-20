"""
Unit tests for FIDO2 authenticate_fido2_registration.py module

Tests the get_assertion_options and submit_assertion_result functions.
Uses importlib to import the actual module for patching.
"""

import importlib
import pytest
from httpx import AsyncClient, HTTPStatusError, Request, Response
from unittest.mock import AsyncMock, MagicMock, patch
from app.fido2.schemas import AssertionOptionsRequest, FIDO2AssertionResultRequest

# Import the module using importlib to get the actual module object
auth_module = importlib.import_module(
    "app.fido2.services.authenticate_fido2_registration"
)

# Import functions directly for testing
get_assertion_options = auth_module.get_assertion_options
submit_assertion_result = auth_module.submit_assertion_result


class TestGetAssertionOptions:
    """Tests for get_assertion_options function"""

    @pytest.fixture
    def mock_http_client(self):
        """Create a mock HTTP client"""
        return AsyncMock(spec=AsyncClient)

    @pytest.mark.asyncio
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_user_profile_info")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_successful_assertion_options(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_profile_info,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should successfully get assertion options"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-id-456",
        )
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "challenge": "abc123",
            "allowCredentials": [],
            "timeout": 60000,
        }
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        request_data = AssertionOptionsRequest()
        result = await get_assertion_options(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_data=request_data,
        )

        assert result.success is True
        assert result.data["challenge"] == "abc123"
        assert result.message == "Assertion options retrieved successfully"
        mock_get_user_profile_info.assert_called_once_with(
            mock_http_client, "user-token"
        )

    @pytest.mark.asyncio
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_user_profile_info")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_injects_user_id(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_profile_info,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should inject userId into request body"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Display Name",
            "user-123",
        )
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"challenge": "abc123"}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        request_data = AssertionOptionsRequest()
        await get_assertion_options(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_data=request_data,
        )

        # Verify the body sent to the API includes userId
        call_kwargs = mock_http_client.post.call_args[1]
        sent_body = call_kwargs["json"]
        assert sent_body["userId"] == "user-123"
        assert "userVerification" in sent_body

    @pytest.mark.asyncio
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_user_profile_info")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_sets_user_verification_preferred(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_profile_info,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should set userVerification to 'preferred' by default"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-id-456",
        )
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"challenge": "abc123"}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        request_data = AssertionOptionsRequest()
        await get_assertion_options(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_data=request_data,
        )

        # Verify userVerification is set to preferred
        call_kwargs = mock_http_client.post.call_args[1]
        sent_body = call_kwargs["json"]
        assert sent_body["userVerification"] == "preferred"

    @pytest.mark.asyncio
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_user_profile_info")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_calls_correct_endpoint(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_profile_info,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should call the correct assertion/options endpoint"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-id-456",
        )
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"challenge": "abc123"}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        request_data = AssertionOptionsRequest()
        await get_assertion_options(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_data=request_data,
        )

        call_args = mock_http_client.post.call_args[0]
        url = call_args[0]
        assert "/v2.0/factors/fido2/relyingparties/rp-uuid-123/assertion/options" in url

    @pytest.mark.asyncio
    @patch.object(auth_module, "RequestErrorHandler")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_handles_admin_token_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_request_error_handler,
        mock_http_client,
    ):
        """Should handle error when getting admin token fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.side_effect = Exception("Token service error")

        request_data = AssertionOptionsRequest()
        await get_assertion_options(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_data=request_data,
        )

        mock_request_error_handler.handle.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(auth_module, "RequestErrorHandler")
    @patch.object(auth_module, "get_user_profile_info")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_handles_user_profile_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_profile_info,
        mock_request_error_handler,
        mock_http_client,
    ):
        """Should handle error when getting user profile fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_user_profile_info.side_effect = Exception("Profile fetch error")

        request_data = AssertionOptionsRequest()
        await get_assertion_options(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_data=request_data,
        )

        mock_request_error_handler.handle.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(auth_module, "RequestErrorHandler")
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_user_profile_info")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_handles_http_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_profile_info,
        mock_get_auth_request_headers,
        mock_request_error_handler,
        mock_http_client,
    ):
        """Should handle HTTP error from API"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-id-456",
        )
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_request = Request("POST", "https://example.com")
        mock_response = Response(400, request=mock_request)
        mock_response_obj = MagicMock()
        mock_response_obj.raise_for_status.side_effect = HTTPStatusError(
            message="Bad Request", request=mock_request, response=mock_response
        )
        mock_http_client.post = AsyncMock(return_value=mock_response_obj)

        request_data = AssertionOptionsRequest()
        await get_assertion_options(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_data=request_data,
        )

        mock_request_error_handler.handle.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_user_profile_info")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_uses_admin_token_for_request(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_profile_info,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should use admin token for assertion options request"""
        admin_token = "specific-admin-token"
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = admin_token
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-id-456",
        )
        mock_get_auth_request_headers.return_value = {
            "Authorization": f"Bearer {admin_token}"
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"challenge": "abc123"}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        request_data = AssertionOptionsRequest()
        await get_assertion_options(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_data=request_data,
        )

        # Verify admin token was used
        mock_get_auth_request_headers.assert_called_once_with(
            admin_token, json_content_type=True
        )


class TestSubmitAssertionResult:
    """Tests for submit_assertion_result function"""

    @pytest.fixture
    def mock_http_client(self):
        """Create a mock HTTP client"""
        return AsyncMock(spec=AsyncClient)

    @pytest.fixture
    def mock_request(self):
        """Create a mock FastAPI Request object"""
        mock_req = MagicMock()
        mock_req.session = {}
        return mock_req

    @pytest.fixture
    def mock_assertion_request(self):
        """Create mock assertion result request data"""
        mock_data = MagicMock(spec=FIDO2AssertionResultRequest)
        mock_data.model_dump.return_value = {
            "id": "credential-id",
            "rawId": "raw-id",
            "type": "public-key",
            "response": {
                "authenticatorData": "auth-data",
                "clientDataJSON": "client-data",
                "signature": "signature",
            },
        }
        return mock_data

    @pytest.mark.asyncio
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_successful_assertion_result(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should successfully submit assertion result"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok", "verified": True}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        result = await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=False,
        )

        assert result.success is True
        assert result.message == "FIDO2 authentication completed successfully"

    @pytest.mark.asyncio
    @patch("app.auth.services.auth_user_session.update_session_tokens")
    @patch("app.auth.services.auth_user_session.introspect_user_token")
    @patch.object(auth_module, "_exchange_fido2_jwt_for_access_token")
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_return_jwt_true_with_stepup_token(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_exchange_fido2_jwt,
        mock_introspect_token,
        mock_update_session_tokens,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should use stepup_token from session for FIDO2 step-up authentication"""
        # Set stepup_token in session
        mock_request.session = {"stepup_token": "stepup-token-from-password-verify"}

        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"

        # Mock auth headers to accept the stepup token
        def mock_headers_func(token, json_content_type=False):
            return {"Authorization": f"Bearer {token}"}

        mock_get_auth_request_headers.side_effect = mock_headers_func

        mock_exchange_fido2_jwt.return_value = {
            "access_token": "combined-access-token",
            "id_token": "combined-id-token",
            "refresh_token": "new-refresh-token",
        }
        mock_introspect_token.return_value = AsyncMock()
        mock_update_session_tokens.return_value = None

        # Mock response for assertion/result
        assertion_response = MagicMock()
        assertion_response.status_code = 200
        assertion_response.json.return_value = {
            "status": "ok",
            "assertion": "fido2-jwt-token",
        }
        assertion_response.raise_for_status = MagicMock()

        mock_http_client.post = AsyncMock(return_value=assertion_response)

        result = await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=True,
        )

        # Verify the POST call to assertion/result endpoint includes returnJwt query parameter
        # The first call should be to the FIDO2 assertion endpoint
        assert mock_http_client.post.call_count >= 1
        first_call_args = mock_http_client.post.call_args_list[0][0]
        url = first_call_args[0]
        assert "returnJwt=true" in url
        assert "assertion/result" in url

        # Verify stepup token was used (not admin token)
        headers_call = mock_get_auth_request_headers.call_args[0][0]
        assert headers_call == "stepup-token-from-password-verify"

        # Verify JWT exchange was called
        assert mock_exchange_fido2_jwt.called

        # Note: If introspect_user_token fails (e.g., admin token issues),
        # the exception is caught and update_session_tokens won't be called.
        # The overall request still succeeds with FIDO2 authentication completed.

        # Verify the result is successful
        assert result.success is True
        assert result.message == "FIDO2 authentication completed successfully"

    @pytest.mark.asyncio
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_return_jwt_false_no_query_parameter(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should not add returnJwt query parameter when return_jwt=False"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok"}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=False,
        )

        # Verify URL does not include returnJwt query parameter
        call_args = mock_http_client.post.call_args[0]
        url = call_args[0]
        assert "returnJwt" not in url

    @pytest.mark.asyncio
    @patch.object(auth_module, "RequestErrorHandler")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_return_jwt_true_without_stepup_token_raises_exception(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_request_error_handler,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should raise exception when return_jwt=True but no stepup_token in session"""
        # No stepup_token in session
        mock_request.session = {}

        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"

        await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=True,
        )

        # Should call error handler with exception about missing stepup token
        mock_request_error_handler.handle.assert_called_once()
        error_arg = mock_request_error_handler.handle.call_args[0][0]
        assert isinstance(error_arg, Exception)
        assert "Step-up authentication required" in str(error_arg)
        assert "POST /v1/password/verify/stepup first" in str(error_arg)

    @pytest.mark.asyncio
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_calls_correct_endpoint(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should call the correct assertion/result endpoint"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok"}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=False,
        )

        call_args = mock_http_client.post.call_args[0]
        url = call_args[0]
        assert "/v2.0/factors/fido2/relyingparties/rp-uuid-123/assertion/result" in url

    @pytest.mark.asyncio
    @patch.object(auth_module, "RequestErrorHandler")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_handles_admin_token_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_request_error_handler,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should handle error when getting admin token fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.side_effect = Exception("Token service error")

        await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=False,
        )

        mock_request_error_handler.handle.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(auth_module, "RequestErrorHandler")
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_handles_http_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_request_error_handler,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should handle HTTP error from API"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_request_obj = Request("POST", "https://example.com")
        mock_response = Response(401, request=mock_request_obj)
        mock_response_obj = MagicMock()
        mock_response_obj.raise_for_status.side_effect = HTTPStatusError(
            message="Unauthorized", request=mock_request_obj, response=mock_response
        )
        mock_http_client.post = AsyncMock(return_value=mock_response_obj)

        await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=False,
        )

        mock_request_error_handler.handle.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_uses_model_dump_for_request_body(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should use model_dump to serialize request body"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok"}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=False,
        )

        # Verify model_dump was called
        mock_assertion_request.model_dump.assert_called_once_with(exclude_none=True)

    @pytest.mark.asyncio
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_uses_admin_token_for_request(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should use admin token for assertion result request"""
        admin_token = "specific-admin-token"
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = admin_token
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": f"Bearer {admin_token}"
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok"}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=False,
        )

        # Verify admin token was used
        mock_get_auth_request_headers.assert_called_once_with(
            admin_token, json_content_type=True
        )

    @pytest.mark.asyncio
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_returns_response_data_in_result(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should return API response data in ResponseModel"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        expected_response = {"status": "ok", "verified": True, "userId": "user-123"}
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = expected_response
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        result = await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=False,
        )

        assert result.data == expected_response
        assert result.data["status"] == "ok"
        assert result.data["verified"] is True

    @pytest.mark.asyncio
    @patch.object(auth_module, "RequestErrorHandler")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_handles_generic_exception(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_request_error_handler,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should handle any generic exception and call error handler"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.side_effect = Exception("Unexpected error")

        await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=False,
        )

        mock_request_error_handler.handle.assert_called_once()
        error_arg = mock_request_error_handler.handle.call_args[0][0]
        assert isinstance(error_arg, Exception)
        assert "Unexpected error" in str(error_arg)


class TestExchangeFido2JwtForAccessToken:
    """Tests for _exchange_fido2_jwt_for_access_token helper function"""

    @pytest.fixture
    def mock_http_client(self):
        """Create a mock HTTP client"""
        return AsyncMock(spec=AsyncClient)

    @pytest.mark.asyncio
    async def test_successful_token_exchange(self, mock_http_client):
        """Should successfully exchange FIDO2 JWT for combined OAuth access token"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "combined-access-token-123",
            "id_token": "combined-id-token-456",
            "refresh_token": "new-refresh-token-789",
            "token_type": "Bearer",
            "expires_in": 3600,
        }
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        # Access the private function
        exchange_func = auth_module._exchange_fido2_jwt_for_access_token

        result = await exchange_func(
            http_client=mock_http_client,
            tenant_url="https://tenant.verify.ibm.com",
            fido2_jwt="fido2-jwt-token",
            client_id="client-id-123",
            client_secret="client-secret-456",
        )

        # Should return full token data now
        assert isinstance(result, dict)
        assert result["access_token"] == "combined-access-token-123"
        assert result["id_token"] == "combined-id-token-456"
        assert result["refresh_token"] == "new-refresh-token-789"

        # Verify the POST call
        mock_http_client.post.assert_called_once()
        call_args = mock_http_client.post.call_args
        url = call_args[0][0]
        assert "https://tenant.verify.ibm.com/oauth2/token" in url

        # Verify request data
        data = call_args[1]["data"]
        assert data["grant_type"] == "urn:ietf:params:oauth:grant-type:jwt-bearer"
        assert data["assertion"] == "fido2-jwt-token"

        # Verify headers
        headers = call_args[1]["headers"]
        assert "Authorization" in headers
        assert headers["Authorization"].startswith("Basic ")

    @pytest.mark.asyncio
    async def test_handles_http_error(self, mock_http_client):
        """Should handle HTTP errors during token exchange"""
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Invalid grant"

        http_error = HTTPStatusError(
            "400 Bad Request",
            request=MagicMock(spec=Request),
            response=mock_response,
        )
        mock_http_client.post = AsyncMock(side_effect=http_error)

        exchange_func = auth_module._exchange_fido2_jwt_for_access_token

        with pytest.raises(HTTPStatusError):
            await exchange_func(
                http_client=mock_http_client,
                tenant_url="https://tenant.verify.ibm.com",
                fido2_jwt="fido2-jwt-token",
                client_id="client-id-123",
                client_secret="client-secret-456",
            )

    @pytest.mark.asyncio
    async def test_handles_missing_access_token(self, mock_http_client):
        """Should handle response without access_token field"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "token_type": "Bearer",
            "expires_in": 3600,
        }
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        exchange_func = auth_module._exchange_fido2_jwt_for_access_token

        with pytest.raises(Exception) as exc_info:
            await exchange_func(
                http_client=mock_http_client,
                tenant_url="https://tenant.verify.ibm.com",
                fido2_jwt="fido2-jwt-token",
                client_id="client-id-123",
                client_secret="client-secret-456",
            )

        assert "No access_token" in str(exc_info.value)


class TestSubmitAssertionResultEdgeCases:
    """Additional tests for submit_assertion_result edge cases and uncovered branches"""

    @pytest.fixture
    def mock_http_client(self):
        """Create a mock HTTP client"""
        return AsyncMock(spec=AsyncClient)

    @pytest.fixture
    def mock_request(self):
        """Create a mock FastAPI Request object"""
        mock_req = MagicMock()
        mock_req.session = {}
        return mock_req

    @pytest.fixture
    def mock_assertion_request(self):
        """Create mock assertion result request data"""
        mock_data = MagicMock(spec=FIDO2AssertionResultRequest)
        mock_data.model_dump.return_value = {
            "id": "credential-id",
            "rawId": "raw-id",
            "type": "public-key",
            "response": {
                "authenticatorData": "auth-data",
                "clientDataJSON": "client-data",
                "signature": "signature",
            },
        }
        return mock_data

    @pytest.mark.asyncio
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_return_jwt_true_without_assertion_in_response(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should handle return_jwt=True when response doesn't contain assertion"""
        mock_request.session = {"stepup_token": "stepup-token-123"}

        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer stepup-token-123"
        }

        # Response without assertion field
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok", "verified": True}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        result = await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=True,
        )

        # Should still succeed
        assert result.success is True
        assert result.message == "FIDO2 authentication completed successfully"
        # JWT shouldn't be stored since there's no assertion
        assert "fido2_auth_jwt" not in mock_request.session

    @pytest.mark.asyncio
    @patch("app.auth.services.auth_user_session.update_session_tokens")
    @patch.object(auth_module, "introspect_user_token")
    @patch.object(auth_module, "_exchange_fido2_jwt_for_access_token")
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_cleans_up_stepup_grant_id_from_session(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_exchange_fido2_jwt,
        mock_introspect_token,
        mock_update_session_tokens,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should clean up both stepup_token and stepup_grant_id from session"""
        # Session with both stepup_token and stepup_grant_id
        mock_request.session = {
            "stepup_token": "stepup-token-123",
            "stepup_grant_id": "grant-id-456",
        }

        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer stepup-token-123"
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "ok",
            "verified": True,
            "assertion": "fido2-jwt-token",
        }
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        mock_exchange_fido2_jwt.return_value = {
            "access_token": "new-token",
            "refresh_token": "new-refresh",
        }
        mock_introspect_token.return_value = AsyncMock()

        result = await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=True,
        )

        assert result.success is True
        # Both should be cleaned up after successful token exchange
        assert "stepup_token" not in mock_request.session
        assert "stepup_grant_id" not in mock_request.session
        # fido2_auth_jwt should be stored
        assert mock_request.session["fido2_auth_jwt"] == "fido2-jwt-token"

    @pytest.mark.asyncio
    @patch("app.auth.services.auth_user_session.update_session_tokens")
    @patch.object(auth_module, "introspect_user_token")
    @patch.object(auth_module, "_exchange_fido2_jwt_for_access_token")
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_continues_despite_introspect_token_failure(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_exchange_fido2_jwt,
        mock_introspect_token,
        mock_update_session_tokens,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should continue successfully even if introspect_user_token fails"""
        mock_request.session = {"stepup_token": "stepup-token-123"}

        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer stepup-token-123"
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "ok",
            "verified": True,
            "assertion": "fido2-jwt-token",
        }
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        mock_exchange_fido2_jwt.return_value = {
            "access_token": "new-token",
            "refresh_token": "new-refresh",
        }
        # Introspect fails
        mock_introspect_token.side_effect = Exception("Introspect failed")

        result = await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=True,
        )

        # Should still succeed despite introspect failure (exception is caught gracefully)
        assert result.success is True
        mock_introspect_token.assert_called_once()
        # Session cleanup doesn't happen when exception occurs
        assert "stepup_token" in mock_request.session  # Still present due to exception

    @pytest.mark.asyncio
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_url_without_return_jwt_parameter(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should build URL without returnJwt query parameter when return_jwt=False"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok", "verified": True}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        result = await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=False,
        )

        assert result.success is True
        # Verify URL doesn't contain returnJwt query parameter
        call_args = mock_http_client.post.call_args
        url = call_args[0][0]
        assert "returnJwt" not in url
        assert url.endswith("/assertion/result")

    @pytest.mark.asyncio
    @patch("app.auth.services.auth_user_session.update_session_tokens")
    @patch.object(auth_module, "introspect_user_token")
    @patch.object(auth_module, "_exchange_fido2_jwt_for_access_token")
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_handles_exchange_without_access_token_gracefully(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_exchange_fido2_jwt,
        mock_introspect_token,
        mock_update_session_tokens,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should handle gracefully when token exchange returns data without access_token"""
        mock_request.session = {"stepup_token": "stepup-token-123"}

        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer stepup-token-123"
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "ok",
            "verified": True,
            "assertion": "fido2-jwt-token",
        }
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        # Token exchange returns data with None access_token
        mock_exchange_fido2_jwt.return_value = {
            "access_token": None,
            "refresh_token": "new-refresh",
        }
        mock_introspect_token.return_value = AsyncMock()

        result = await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=True,
        )

        # Should still succeed (graceful error handling)
        assert result.success is True
        # introspect should be called with None
        mock_introspect_token.assert_called_once_with(mock_http_client, None)
        # Session cleanup still happens even with None access_token
        assert "stepup_token" not in mock_request.session
