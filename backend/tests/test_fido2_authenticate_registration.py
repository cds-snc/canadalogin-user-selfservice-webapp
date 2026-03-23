"""
Unit tests for FIDO2 authenticate_fido2_registration.py module

Tests the get_assertion_options and submit_assertion_result functions.
Uses importlib to import the actual module for patching.
"""

import importlib
import time
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
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_user_profile_info")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_uses_user_token_for_request(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_profile_info,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should use user access token for assertion options request"""
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
            "Authorization": "Bearer user-token"
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

        # Verify user access token was used
        mock_get_auth_request_headers.assert_called_once_with(
            "user-token", json_content_type=True
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
        mock_response.json.return_value = {"status": "ok", "verified": True }
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
    @patch.object(auth_module, "_exchange_fido2_jwt_for_access_token")
    @patch.object(auth_module, "_perform_mfa_refresh_token_flow")
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
        mock_perform_mfa_refresh,
        mock_exchange_fido2_jwt,
        mock_update_session_tokens,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should use stepup_refresh_token from session for FIDO2 step-up authentication"""
        # Set stepup tokens in session
        mock_request.session = {
            "stepup_token_data": {
                "access_token": "stepup-access-token-123",
                "refresh_token": "stepup-refresh-token-from-password-verify",
                "grant_id": "grant-id-123",
                "expires_in": 3600,
                "scope": "openid profile offline_access email",
                "token_type": "bearer",
            },
            "stepup_token_timestamp": time.time(),
        }

        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"

        # Mock auth headers to accept the stepup token
        def mock_headers_func(token, json_content_type=False):
            return {"Authorization": f"Bearer {token}"}

        mock_get_auth_request_headers.side_effect = mock_headers_func

        mock_perform_mfa_refresh.return_value = {
            "access_token": "mfa-challenge-token",
            "scope": "mfa_challenge",
            "allowedFactors": ["fido2"],
        }
        mock_exchange_fido2_jwt.return_value = {
            "access_token": "combined-access-token",
            "id_token": "combined-id-token",
            "refresh_token": "new-refresh-token",
            "expires_in": 3600,
        }
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

        # Verify MFA refresh flow was called
        assert mock_perform_mfa_refresh.called

        # Verify MFA challenge token was used (not admin token)
        headers_call = mock_get_auth_request_headers.call_args[0][0]
        assert headers_call == "mfa-challenge-token"

        # Verify JWT exchange was called
        assert mock_exchange_fido2_jwt.called

        # Verify userinfo fetch was called
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
    async def test_uses_user_token_for_request(
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
        """Should use user access token for assertion result request"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer user-token"
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

        # Verify user access token was used
        mock_get_auth_request_headers.assert_called_once_with(
            "user-token", json_content_type=True
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
    @patch.object(auth_module, "_perform_mfa_refresh_token_flow")
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
        mock_perform_mfa_refresh,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should handle return_jwt=True when response doesn't contain assertion"""
        mock_request.session = {
            "stepup_token_data": {
                "access_token": "stepup-access-123",
                "refresh_token": "stepup-refresh-123",
                "grant_id": "grant-id-123",
                "expires_in": 3600,
                "scope": "openid profile offline_access email",
                "token_type": "bearer",
            },
            "stepup_token_timestamp": time.time(),
        }

        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer mfa-challenge-token"
        }

        mock_perform_mfa_refresh.return_value = {
            "access_token": "mfa-challenge-token",
            "scope": "mfa_challenge",
            "allowedFactors": ["fido2"],
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
    @patch("starsessions.get_session_handler")
    @patch("app.auth.services.auth_user_session.update_session_tokens")
    @patch.object(auth_module, "_exchange_fido2_jwt_for_access_token")
    @patch.object(auth_module, "_perform_mfa_refresh_token_flow")
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
        mock_perform_mfa_refresh,
        mock_exchange_fido2_jwt,
        mock_update_session_tokens,
        mock_get_session_handler,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should clean up stepup_token_data and stepup_token_timestamp from session"""
        # Session with stepup tokens
        mock_request.session = {
            "stepup_token_data": {
                "access_token": "stepup-access-123",
                "refresh_token": "stepup-refresh-123",
                "grant_id": "grant-id-456",
                "expires_in": 3600,
                "scope": "openid profile offline_access email",
                "token_type": "bearer",
            },
            "stepup_token_timestamp": time.time(),
        }

        # Mock session handler
        mock_handler = MagicMock()
        mock_get_session_handler.return_value = mock_handler

        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer mfa-challenge-token"
        }

        mock_perform_mfa_refresh.return_value = {
            "access_token": "mfa-challenge-token",
            "scope": "mfa_challenge",
            "allowedFactors": ["fido2"],
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

        # Create a valid id_token JWT with sid
        import base64
        import json

        payload = {
            "sid": "session-id-123",
            "amr": ["password", "fido2"],
            "sub": "user-123",
        }
        payload_b64 = (
            base64.b64encode(json.dumps(payload).encode()).decode().rstrip("=")
        )
        id_token = f"header.{payload_b64}.signature"

        mock_exchange_fido2_jwt.return_value = {
            "access_token": "new-token",
            "refresh_token": "new-refresh",
            "expires_in": 3600,
            "id_token": id_token,
        }
        result = await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=True,
        )

        assert result.success is True
        # All stepup tokens should be cleaned up after successful token exchange
        assert "stepup_token_data" not in mock_request.session
        assert "stepup_token_timestamp" not in mock_request.session
        # fido2_auth_jwt should NOT be stored in the session (used transiently for exchange only)
        assert "fido2_auth_jwt" not in mock_request.session

    @pytest.mark.asyncio
    @patch("app.auth.services.auth_user_session.update_session_tokens")
    @patch.object(auth_module, "_exchange_fido2_jwt_for_access_token")
    @patch.object(auth_module, "_perform_mfa_refresh_token_flow")
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_continues_despite_token_exchange_failure(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_perform_mfa_refresh,
        mock_exchange_fido2_jwt,
        mock_update_session_tokens,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should continue successfully even if token exchange fails"""
        mock_request.session = {
            "stepup_token_data": {
                "access_token": "stepup-access-123",
                "refresh_token": "stepup-refresh-123",
                "grant_id": "grant-id-123",
                "expires_in": 3600,
                "scope": "openid profile offline_access email",
                "token_type": "bearer",
            },
            "stepup_token_timestamp": time.time(),
        }

        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer mfa-challenge-token"
        }

        mock_perform_mfa_refresh.return_value = {
            "access_token": "mfa-challenge-token",
            "scope": "mfa_challenge",
            "allowedFactors": ["fido2"],
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

        # Token exchange fails
        mock_exchange_fido2_jwt.side_effect = Exception("Token exchange failed")

        result = await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=True,
        )

        # Should still succeed despite exchange failure (exception is caught gracefully)
        assert result.success is True
        mock_exchange_fido2_jwt.assert_called_once()
        # Session cleanup doesn't happen when exception occurs
        assert (
            "stepup_token_data" in mock_request.session
        )  # Still present due to exception

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
    @patch.object(auth_module, "_exchange_fido2_jwt_for_access_token")
    @patch.object(auth_module, "_perform_mfa_refresh_token_flow")
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_updates_session_with_token_metadata(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_perform_mfa_refresh,
        mock_exchange_fido2_jwt,
        mock_update_session_tokens,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should update session with full token metadata"""
        mock_request.session = {
            "stepup_token_data": {
                "access_token": "stepup-access-123",
                "refresh_token": "stepup-refresh-123",
                "grant_id": "grant-id-123",
                "expires_in": 3600,
                "scope": "openid profile offline_access email",
                "token_type": "bearer",
            },
            "stepup_token_timestamp": time.time(),
        }

        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer mfa-challenge-token"
        }

        mock_perform_mfa_refresh.return_value = {
            "access_token": "mfa-challenge-token",
            "scope": "mfa_challenge",
            "allowedFactors": ["fido2"],
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

        # Token exchange returns full metadata
        mock_exchange_fido2_jwt.return_value = {
            "access_token": "combined-token-123",
            "refresh_token": "new-refresh-456",
            "id_token": "new-id-789",
            "expires_in": 7200,
            "token_type": "Bearer",
        }
        result = await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=True,
        )

        # Should succeed and update session with full token data
        assert result.success is True
        # Verify update_session_tokens was called with full metadata
        mock_update_session_tokens.assert_called_once()
        call_args = mock_update_session_tokens.call_args[0]
        token_data = call_args[1]
        assert token_data["access_token"] == "combined-token-123"
        assert token_data["expires_in"] == 7200
        # Session cleanup happens after successful exchange
        assert "stepup_token_data" not in mock_request.session

    @pytest.mark.asyncio
    @patch("app.auth.services.auth_user_session.update_session_tokens")
    @patch.object(auth_module, "_exchange_fido2_jwt_for_access_token")
    @patch.object(auth_module, "_perform_mfa_refresh_token_flow")
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_preserves_original_id_token_and_sid_in_merged_session(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_perform_mfa_refresh,
        mock_exchange_fido2_jwt,
        mock_update_session_tokens,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """
        The merged session must preserve the original id_token and sid from the OIDC
        login, even though the jwt-bearer exchange returns a new id_token with a
        different sid.  If the new id_token were stored, rplogout would send an
        id_token_hint that doesn't match the browser's ci_session cookie and the
        user would be redirected to a logout consent screen instead of logging out
        automatically.

        The AMR claims from the combined token ARE patched in so downstream code
        can verify step-up authentication was completed.
        """
        from app.constants.session_keys import SessionKeys

        original_id_token = "original.oidc.idtoken"

        # Set up session with existing token data including original id_token and userinfo
        mock_request.session = {
            "stepup_token_data": {
                "access_token": "stepup-access-123",
                "refresh_token": "stepup-refresh-123",
                "expires_in": 3600,
            },
            "stepup_token_timestamp": time.time(),
            SessionKeys.SESSION_USER_TOKEN.value: {
                "access_token": "old-access-token",
                "refresh_token": "old-refresh-token",
                "id_token": original_id_token,
                "userinfo": {
                    "sid": "original-sid-from-oidc-login",
                    "sub": "user-123",
                    "email": "user@example.com",
                    "amr": ["pwd"],
                },
            },
        }

        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer mfa-token"
        }
        mock_perform_mfa_refresh.return_value = {
            "access_token": "mfa-challenge-token",
            "scope": "mfa_challenge",
            "allowedFactors": ["fido2"],
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

        # The jwt-bearer exchange returns a NEW id_token with a DIFFERENT sid
        import base64
        import json

        combined_payload = {
            "sid": "new-combined-sid-different-from-original",
            "amr": ["password", "fido2"],
            "sub": "user-123",
        }
        combined_payload_b64 = (
            base64.b64encode(json.dumps(combined_payload).encode()).decode().rstrip("=")
        )
        combined_id_token = f"header.{combined_payload_b64}.signature"

        mock_exchange_fido2_jwt.return_value = {
            "access_token": "combined-access-token",
            "refresh_token": "combined-refresh-token",
            "id_token": combined_id_token,
            "expires_in": 7200,
        }

        result = await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=True,
        )

        assert result.success is True
        mock_update_session_tokens.assert_called_once()
        call_args = mock_update_session_tokens.call_args[0]
        token_data = call_args[1]

        # Elevated access + refresh tokens from the jwt-bearer exchange
        assert token_data["access_token"] == "combined-access-token"
        assert token_data["refresh_token"] == "combined-refresh-token"

        # CRITICAL: original id_token must be preserved so rplogout works without consent
        assert token_data["id_token"] == original_id_token

        # CRITICAL: original sid must be preserved for Redis session lookup and SSE
        assert token_data["userinfo"]["sid"] == "original-sid-from-oidc-login"
        assert token_data["userinfo"]["sub"] == "user-123"
        assert token_data["userinfo"]["email"] == "user@example.com"

        # AMR is updated to reflect the elevated step-up authentication
        assert token_data["userinfo"]["amr"] == ["password", "fido2"]


class TestPerformMfaRefreshTokenFlow:
    """Tests for _perform_mfa_refresh_token_flow helper function"""

    @pytest.fixture
    def mock_http_client(self):
        """Create a mock HTTP client"""
        return AsyncMock(spec=AsyncClient)

    @pytest.mark.asyncio
    async def test_successful_mfa_refresh_token_flow(self, mock_http_client):
        """Should successfully perform MFA refresh token flow"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "mfa-challenge-token-xyz",
            "scope": "mfa_challenge",
            "allowedFactors": ["fido2"],
            "expires_in": 300,
        }
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        # Access the private function
        mfa_flow_func = auth_module._perform_mfa_refresh_token_flow

        result = await mfa_flow_func(
            http_client=mock_http_client,
            tenant_url="https://tenant.verify.ibm.com",
            refresh_token="refresh-token-123",
            client_id="client-id",
            client_secret="client-secret",
        )

        # Should return token data
        assert isinstance(result, dict)
        assert result["access_token"] == "mfa-challenge-token-xyz"
        assert result["scope"] == "mfa_challenge"
        assert result["allowedFactors"] == ["fido2"]

        # Verify the POST call
        mock_http_client.post.assert_called_once()
        call_args = mock_http_client.post.call_args
        url = call_args[0][0]
        assert "/oauth2/token" in url

        # Verify request data
        data = call_args[1]["data"]
        assert data["grant_type"] == "refresh_token"
        assert data["refresh_token"] == "refresh-token-123"

        # Verify headers include Basic auth
        headers = call_args[1]["headers"]
        assert "Authorization" in headers
        assert headers["Authorization"].startswith("Basic ")

    @pytest.mark.asyncio
    async def test_verifies_scope_contains_mfa_challenge(self, mock_http_client):
        """Should log warning if scope doesn't contain mfa_challenge"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "token-123",
            "scope": "some_other_scope",  # Missing mfa_challenge
            "allowedFactors": ["fido2"],
        }
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        mfa_flow_func = auth_module._perform_mfa_refresh_token_flow

        result = await mfa_flow_func(
            http_client=mock_http_client,
            tenant_url="https://tenant.verify.ibm.com",
            refresh_token="refresh-token-123",
            client_id="client-id",
            client_secret="client-secret",
        )

        # Should still return the data (just logs warning)
        assert result["scope"] == "some_other_scope"
        assert "access_token" in result

    @pytest.mark.asyncio
    async def test_verifies_allowed_factors_contains_fido2(self, mock_http_client):
        """Should log warning if allowedFactors doesn't contain fido2"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "token-123",
            "scope": "mfa_challenge",
            "allowedFactors": ["totp", "sms"],  # Missing fido2
        }
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        mfa_flow_func = auth_module._perform_mfa_refresh_token_flow

        result = await mfa_flow_func(
            http_client=mock_http_client,
            tenant_url="https://tenant.verify.ibm.com",
            refresh_token="refresh-token-123",
            client_id="client-id",
            client_secret="client-secret",
        )

        # Should still return the data (just logs warning)
        assert result["allowedFactors"] == ["totp", "sms"]
        assert "access_token" in result

    @pytest.mark.asyncio
    async def test_handles_http_error(self, mock_http_client):
        """Should handle HTTP errors during MFA refresh token flow"""
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Invalid refresh token"

        http_error = HTTPStatusError(
            "400 Bad Request",
            request=MagicMock(spec=Request),
            response=mock_response,
        )
        mock_http_client.post = AsyncMock(side_effect=http_error)

        mfa_flow_func = auth_module._perform_mfa_refresh_token_flow

        with pytest.raises(HTTPStatusError):
            await mfa_flow_func(
                http_client=mock_http_client,
                tenant_url="https://tenant.verify.ibm.com",
                refresh_token="invalid-token",
                client_id="client-id",
                client_secret="client-secret",
            )


class TestIsTokenExpired:
    """Tests for _is_token_expired helper function"""

    def test_token_not_expired(self):
        """Should return False when token is still valid"""
        is_expired_func = auth_module._is_token_expired

        token_data = {"expires_in": 3600}
        token_timestamp = time.time()

        result = is_expired_func(token_data, token_timestamp)
        assert result is False

    def test_token_expired(self):
        """Should return True when token has expired"""
        is_expired_func = auth_module._is_token_expired

        token_data = {"expires_in": 3600}
        token_timestamp = time.time() - 3700  # More than 3600 seconds ago

        result = is_expired_func(token_data, token_timestamp)
        assert result is True

    def test_token_expiring_soon_with_buffer(self):
        """Should return True when token is within 30 second expiry buffer"""
        is_expired_func = auth_module._is_token_expired

        token_data = {"expires_in": 3600}
        token_timestamp = time.time() - 3580  # 20 seconds left, within 30s buffer

        result = is_expired_func(token_data, token_timestamp)
        assert result is True

    def test_missing_token_data(self):
        """Should return True when token data is None"""
        is_expired_func = auth_module._is_token_expired

        result = is_expired_func(None, time.time())
        assert result is True

    def test_missing_timestamp(self):
        """Should return True when timestamp is None"""
        is_expired_func = auth_module._is_token_expired

        token_data = {"expires_in": 3600}
        result = is_expired_func(token_data, None)
        assert result is True

    def test_zero_expires_in(self):
        """Should return True when expires_in is 0"""
        is_expired_func = auth_module._is_token_expired

        token_data = {"expires_in": 0}
        result = is_expired_func(token_data, time.time())
        assert result is True


# ---------------------------------------------------------------------------
# Helper: _decode_jwt_payload
# ---------------------------------------------------------------------------


class TestDecodeJwtPayload:
    """Tests for _decode_jwt_payload internal helper"""

    def _make_jwt(self, payload: dict) -> str:
        """Build a minimal JWT string with a real base64url-encoded payload."""
        import base64
        import json

        payload_bytes = json.dumps(payload).encode()
        # Strip '=' padding to mimic real JWTs
        payload_b64 = base64.b64encode(payload_bytes).decode().rstrip("=")
        return f"header.{payload_b64}.signature"

    def test_valid_jwt_returns_payload(self):
        """Should decode and return the payload dict from a well-formed JWT"""
        payload = {"sub": "user-123", "sid": "some-sid", "amr": ["password"]}
        token = self._make_jwt(payload)
        result = auth_module._decode_jwt_payload(token)
        assert result == payload

    def test_valid_jwt_missing_padding(self):
        """Should handle base64url payloads of any length (padding re-added internally)"""
        # Exercise all four modulo-4 residue classes by varying payload content
        for extra in ["", "x", "xx", "xxx"]:
            payload = {"key": f"v{extra}"}
            token = self._make_jwt(payload)
            result = auth_module._decode_jwt_payload(token)
            assert result == {"key": f"v{extra}"}

    def test_not_three_parts_returns_none(self):
        """Should return None when the JWT does not have exactly 3 parts"""
        assert auth_module._decode_jwt_payload("only.two") is None
        assert auth_module._decode_jwt_payload("a.b.c.d") is None
        assert auth_module._decode_jwt_payload("nodots") is None

    def test_invalid_base64_returns_none(self):
        """Should return None and log a warning if base64 decoding fails"""
        token = "header.!!!invalid_base64!!!.signature"
        result = auth_module._decode_jwt_payload(token)
        assert result is None

    def test_non_json_payload_returns_none(self):
        """Should return None when the payload is valid base64 but not JSON"""
        import base64

        payload_b64 = base64.b64encode(b"not-json-at-all").decode().rstrip("=")
        token = f"header.{payload_b64}.signature"
        result = auth_module._decode_jwt_payload(token)
        assert result is None

    def test_empty_payload_dict_returns_dict(self):
        """Should return an empty dict when JWT payload encodes {}"""
        token = self._make_jwt({})
        result = auth_module._decode_jwt_payload(token)
        assert result == {}


# ---------------------------------------------------------------------------
# Helper: _validate_stepup_tokens
# ---------------------------------------------------------------------------


class TestValidateStepupTokens:
    """Tests for _validate_stepup_tokens internal helper"""

    def _make_request(self, session: dict) -> MagicMock:
        req = MagicMock()
        req.session = session
        return req

    def test_missing_stepup_token_data_returns_none(self):
        """Should return None when stepup_token_data is not in session"""
        request = self._make_request({})
        result = auth_module._validate_stepup_tokens(request)
        assert result is None

    def test_none_stepup_token_data_returns_none(self):
        """Should return None when stepup_token_data is explicitly None"""
        request = self._make_request({"stepup_token_data": None})
        result = auth_module._validate_stepup_tokens(request)
        assert result is None

    def test_expired_token_raises(self):
        """Should raise when the stepup token has expired (timestamp = 0 means always expired)"""
        request = self._make_request(
            {
                "stepup_token_data": {"access_token": "tok", "expires_in": 60},
                "stepup_token_timestamp": 0,  # epoch — definitely expired
            }
        )
        with pytest.raises(Exception, match="expired"):
            auth_module._validate_stepup_tokens(request)

    def test_valid_token_returns_token_data(self):
        """Should return the stepup_token_data dict when token is present and unexpired"""
        token_data = {"access_token": "tok", "refresh_token": "ref", "expires_in": 3600}
        request = self._make_request(
            {
                "stepup_token_data": token_data,
                "stepup_token_timestamp": time.time(),
            }
        )
        result = auth_module._validate_stepup_tokens(request)
        assert result == token_data

    def test_missing_timestamp_treated_as_expired(self):
        """Should raise when stepup_token_timestamp is absent (treated as expired)"""
        request = self._make_request(
            {
                "stepup_token_data": {"access_token": "tok", "expires_in": 3600},
                # no stepup_token_timestamp key
            }
        )
        with pytest.raises(Exception):
            auth_module._validate_stepup_tokens(request)


# ---------------------------------------------------------------------------
# Helper: _get_mfa_challenge_token
# ---------------------------------------------------------------------------


class TestGetMfaChallengeToken:
    """Tests for _get_mfa_challenge_token internal helper"""

    @pytest.fixture
    def mock_http_client(self):
        return AsyncMock(spec=AsyncClient)

    def _make_request(self, session: dict) -> MagicMock:
        req = MagicMock()
        req.session = session
        return req

    def _valid_session(self) -> dict:
        return {
            "stepup_token_data": {
                "access_token": "stepup-at",
                "refresh_token": "stepup-rt",
                "expires_in": 3600,
            },
            "stepup_token_timestamp": time.time(),
        }

    @pytest.mark.asyncio
    async def test_missing_stepup_raises(self, mock_http_client):
        """Should propagate the exception from _validate_stepup_tokens"""
        request = self._make_request({})
        with pytest.raises(Exception, match="Step-up authentication required"):
            await auth_module._get_mfa_challenge_token(
                request, mock_http_client, "https://tenant.example.com"
            )

    @pytest.mark.asyncio
    async def test_no_refresh_token_in_stepup_raises(self, mock_http_client):
        """Should raise when stepup_token_data has no refresh_token"""
        request = self._make_request(
            {
                "stepup_token_data": {"access_token": "at", "expires_in": 3600},
                "stepup_token_timestamp": time.time(),
            }
        )
        with pytest.raises(Exception, match="No refresh_token"):
            await auth_module._get_mfa_challenge_token(
                request, mock_http_client, "https://tenant.example.com"
            )
            

    @pytest.mark.asyncio
    @patch.object(auth_module, "_perform_mfa_refresh_token_flow")
    async def test_success_returns_access_token(
        self, mock_mfa_refresh, mock_http_client
    ):
        """Should return the access_token from the MFA refresh token response"""
        mock_mfa_refresh.return_value = {
            "access_token": "mfa-challenge-token",
            "scope": "mfa_challenge",
        }
        request = self._make_request(self._valid_session())
        result = await auth_module._get_mfa_challenge_token(
            request, mock_http_client, "https://tenant.example.com"
        )
        assert result == "mfa-challenge-token"
        mock_mfa_refresh.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(auth_module, "_perform_mfa_refresh_token_flow")
    async def test_passes_correct_refresh_token(
        self, mock_mfa_refresh, mock_http_client
    ):
        """Should pass the stepup refresh_token to _perform_mfa_refresh_token_flow"""
        mock_mfa_refresh.return_value = {"access_token": "tok"}
        request = self._make_request(self._valid_session())
        await auth_module._get_mfa_challenge_token(
            request, mock_http_client, "https://tenant.example.com"
        )
        call_kwargs = mock_mfa_refresh.call_args[1]
        assert call_kwargs["refresh_token"] == "stepup-rt"
        assert call_kwargs["tenant_url"] == "https://tenant.example.com"


# ---------------------------------------------------------------------------
# Helper: _build_merged_session_token
# ---------------------------------------------------------------------------


class TestBuildMergedSessionToken:
    """Tests for _build_merged_session_token internal helper"""

    def _make_request(self, session: dict) -> MagicMock:
        req = MagicMock()
        req.session = session
        return req

    def test_preserves_original_id_token(self):
        """New id_token from jwt-bearer exchange must NOT replace the original"""
        from app.constants.session_keys import SessionKeys

        request = self._make_request(
            {
                SessionKeys.SESSION_USER_TOKEN.value: {
                    "id_token": "original-id-token",
                    "access_token": "old-at",
                    "userinfo": {"sid": "orig-sid", "sub": "u1"},
                }
            }
        )
        combined = {
            "access_token": "new-at",
            "refresh_token": "new-rt",
            "id_token": "new-id-token-different-session",
        }
        result = auth_module._build_merged_session_token(request, combined, None)
        assert result["id_token"] == "original-id-token"
        assert result["access_token"] == "new-at"
        assert result["refresh_token"] == "new-rt"

    def test_amr_is_patched_into_userinfo(self):
        """Combined AMR claims should be written into the merged userinfo"""
        from app.constants.session_keys import SessionKeys

        request = self._make_request(
            {
                SessionKeys.SESSION_USER_TOKEN.value: {
                    "id_token": "original-id-token",
                    "userinfo": {"sid": "orig-sid", "amr": ["pwd"], "sub": "u1"},
                }
            }
        )
        combined = {"access_token": "new-at", "id_token": "new-id"}
        result = auth_module._build_merged_session_token(
            request, combined, ["password", "fido2"]
        )
        assert result["userinfo"]["amr"] == ["password", "fido2"]

    def test_none_combined_amr_leaves_original_amr_unchanged(self):
        """When combined_amr is None the original userinfo AMR must not be touched"""
        from app.constants.session_keys import SessionKeys

        request = self._make_request(
            {
                SessionKeys.SESSION_USER_TOKEN.value: {
                    "id_token": "orig-id",
                    "userinfo": {"amr": ["pwd"], "sid": "s1"},
                }
            }
        )
        combined = {"access_token": "new-at"}
        result = auth_module._build_merged_session_token(request, combined, None)
        assert result["userinfo"]["amr"] == ["pwd"]

    def test_original_userinfo_fields_preserved(self):
        """sid, sub, email and other original userinfo fields must be carried over"""
        from app.constants.session_keys import SessionKeys

        original_userinfo = {
            "sid": "original-sid",
            "sub": "user-999",
            "email": "u@example.com",
            "given_name": "Alice",
        }
        request = self._make_request(
            {
                SessionKeys.SESSION_USER_TOKEN.value: {
                    "id_token": "orig-id",
                    "userinfo": original_userinfo,
                }
            }
        )
        combined = {
            "access_token": "elevated-at",
            "id_token": "combined-id-different-sid",
        }
        result = auth_module._build_merged_session_token(
            request, combined, ["password", "fido2"]
        )
        assert result["userinfo"]["sid"] == "original-sid"
        assert result["userinfo"]["sub"] == "user-999"
        assert result["userinfo"]["email"] == "u@example.com"
        assert result["userinfo"]["given_name"] == "Alice"

    def test_empty_session_handled_gracefully(self):
        """Should return a merged token even when session has no existing token data"""

        request = self._make_request({})  # no SESSION_USER_TOKEN key
        combined = {"access_token": "at", "refresh_token": "rt"}
        result = auth_module._build_merged_session_token(request, combined, None)
        # id_token comes from original (None since session empty)
        assert result["id_token"] is None
        assert result["access_token"] == "at"
        assert result["userinfo"] == {}

    def test_returns_copy_not_mutating_original(self):
        """build_merged_session_token must not mutate the combined_token_data dict"""
        from app.constants.session_keys import SessionKeys

        request = self._make_request(
            {
                SessionKeys.SESSION_USER_TOKEN.value: {
                    "id_token": "orig",
                    "userinfo": {"sid": "s"},
                }
            }
        )
        combined = {"access_token": "at", "id_token": "new-id"}
        original_combined = dict(combined)
        auth_module._build_merged_session_token(request, combined, ["password"])
        assert combined == original_combined  # combined must be unchanged


# ---------------------------------------------------------------------------
# Helper: _exchange_and_update_session
# ---------------------------------------------------------------------------


class TestExchangeAndUpdateSession:
    """Tests for _exchange_and_update_session internal helper"""

    @pytest.fixture
    def mock_http_client(self):
        return AsyncMock(spec=AsyncClient)

    def _make_request_with_session(self) -> MagicMock:
        from app.constants.session_keys import SessionKeys

        req = MagicMock()
        req.session = {
            "stepup_token_data": {"access_token": "sat", "refresh_token": "srt"},
            "stepup_token_timestamp": time.time(),
            SessionKeys.SESSION_USER_TOKEN.value: {
                "id_token": "original-id",
                "access_token": "old-at",
                "userinfo": {"sid": "orig-sid", "amr": ["pwd"]},
            },
        }
        return req

    def _make_valid_combined_id_token(self, amr: list) -> str:
        import base64
        import json

        payload = {"sid": "new-combined-sid", "amr": amr, "sub": "u1"}
        b64 = base64.b64encode(json.dumps(payload).encode()).decode().rstrip("=")
        return f"hdr.{b64}.sig"

    @pytest.mark.asyncio
    @patch("app.auth.services.auth_user_session.update_session_tokens")
    @patch.object(auth_module, "_exchange_fido2_jwt_for_access_token")
    async def test_full_success_updates_session_and_cleans_up(
        self, mock_exchange, mock_update_tokens, mock_http_client
    ):
        """Should exchange JWT, call update_session_tokens, and remove stepup keys"""
        combined_id_token = self._make_valid_combined_id_token(["password", "fido2"])
        mock_exchange.return_value = {
            "access_token": "combined-at",
            "refresh_token": "combined-rt",
            "id_token": combined_id_token,
        }
        request = self._make_request_with_session()

        await auth_module._exchange_and_update_session(
            request, mock_http_client, "https://tenant.example.com", "fido2-jwt"
        )

        mock_exchange.assert_called_once()
        assert mock_exchange.call_args[1]["fido2_jwt"] == "fido2-jwt"

        mock_update_tokens.assert_called_once()
        call_token_data = mock_update_tokens.call_args[0][1]
        # Original id_token preserved
        assert call_token_data["id_token"] == "original-id"
        # Elevated access token present
        assert call_token_data["access_token"] == "combined-at"
        # AMR updated
        assert call_token_data["userinfo"]["amr"] == ["password", "fido2"]
        # Original sid preserved
        assert call_token_data["userinfo"]["sid"] == "orig-sid"

    @pytest.mark.asyncio
    @patch("app.auth.services.auth_user_session.update_session_tokens")
    @patch.object(auth_module, "_exchange_fido2_jwt_for_access_token")
    async def test_stepup_keys_removed_from_session_after_success(
        self, mock_exchange, mock_update_tokens, mock_http_client
    ):
        """Should pop stepup_token_data and stepup_token_timestamp from session"""
        combined_id_token = self._make_valid_combined_id_token(["password", "fido2"])
        mock_exchange.return_value = {
            "access_token": "at",
            "refresh_token": "rt",
            "id_token": combined_id_token,
        }
        request = self._make_request_with_session()
        assert "stepup_token_data" in request.session
        assert "stepup_token_timestamp" in request.session

        await auth_module._exchange_and_update_session(
            request, mock_http_client, "https://tenant.example.com", "fido2-jwt"
        )

        assert "stepup_token_data" not in request.session
        assert "stepup_token_timestamp" not in request.session

    @pytest.mark.asyncio
    @patch("app.auth.services.auth_user_session.update_session_tokens")
    @patch.object(auth_module, "_exchange_fido2_jwt_for_access_token")
    async def test_exchange_exception_propagates(
        self, mock_exchange, mock_update_tokens, mock_http_client
    ):
        """Should not swallow exceptions from _exchange_fido2_jwt_for_access_token"""
        mock_exchange.side_effect = Exception("exchange failed")
        request = self._make_request_with_session()

        with pytest.raises(Exception, match="exchange failed"):
            await auth_module._exchange_and_update_session(
                request, mock_http_client, "https://tenant.example.com", "fido2-jwt"
            )
        mock_update_tokens.assert_not_called()

    @pytest.mark.asyncio
    @patch("app.auth.services.auth_user_session.update_session_tokens")
    @patch.object(auth_module, "_exchange_fido2_jwt_for_access_token")
    async def test_no_id_token_in_combined_response(
        self, mock_exchange, mock_update_tokens, mock_http_client
    ):
        """Should work without an id_token in combined response (amr stays as-is)"""
        mock_exchange.return_value = {
            "access_token": "at",
            "refresh_token": "rt",
            # no id_token key
        }
        request = self._make_request_with_session()

        await auth_module._exchange_and_update_session(
            request, mock_http_client, "https://tenant.example.com", "fido2-jwt"
        )

        mock_update_tokens.assert_called_once()
        call_token_data = mock_update_tokens.call_args[0][1]
        # Original id_token preserved (from session)
        assert call_token_data["id_token"] == "original-id"
        # AMR unchanged since no combined id_token to decode
        assert call_token_data["userinfo"]["amr"] == ["pwd"]
