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
    @patch.object(auth_module, "introspect_user_token")
    @patch.object(auth_module, "get_auth_request_headers")
    @patch.object(auth_module, "get_rp_uuid_from_rp_id")
    @patch.object(auth_module, "get_admin_token")
    @patch.object(auth_module, "get_rp_id")
    @patch.object(auth_module, "get_tenant_url")
    async def test_return_jwt_true_adds_query_parameter(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_introspect_user_token,
        mock_http_client,
        mock_request,
        mock_assertion_request,
    ):
        """Should add returnJwt=true query parameter when requested"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }
        mock_introspect_user_token.return_value = AsyncMock()

        # Mock responses for all three POST calls:
        # 1. assertion/result - returns JWT
        # 2. token exchange - returns access token
        # 3. session exchange - establishes session
        assertion_response = MagicMock()
        assertion_response.status_code = 200
        assertion_response.json.return_value = {
            "status": "ok",
            "assertion": "jwt-token",
        }
        assertion_response.raise_for_status = MagicMock()

        token_exchange_response = MagicMock()
        token_exchange_response.status_code = 200
        token_exchange_response.json.return_value = {
            "access_token": "oauth-token",
            "token_type": "Bearer",
        }
        token_exchange_response.raise_for_status = MagicMock()
        token_exchange_response.text = '{"access_token": "oauth-token"}'

        session_response = MagicMock()
        session_response.status_code = 200
        session_response.json.return_value = {"session_id": "session-123"}
        session_response.raise_for_status = MagicMock()

        # Configure mock to return different responses for each call
        mock_http_client.post = AsyncMock(
            side_effect=[assertion_response, token_exchange_response, session_response]
        )

        await submit_assertion_result(
            request=mock_request,
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=mock_assertion_request,
            return_jwt=True,
        )

        # Verify the first POST call (assertion/result) includes returnJwt query parameter
        first_call_args = mock_http_client.post.call_args_list[0][0]
        url = first_call_args[0]
        assert "returnJwt=true" in url

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
