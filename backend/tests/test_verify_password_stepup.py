"""
Unit tests for verify_password_stepup.py module

Tests the enhanced password verification for FIDO2 step-up authentication flow:
1. verify_password_with_jwt() - Verify password with returnJwt=true using current user token
2. exchange_password_jwt_for_token() - Exchange password JWT for OAuth token
3. verify_password_for_stepup() - Main orchestrator function
"""

import importlib
import pytest
from httpx import AsyncClient, HTTPStatusError, Request, Response
from unittest.mock import AsyncMock, MagicMock, patch
from app.password.schemas import UserPassword

# Import the module using importlib to get the actual module object
stepup_module = importlib.import_module("app.password.services.verify_password_stepup")

# Import functions directly for testing
verify_password_with_jwt = stepup_module.verify_password_with_jwt
exchange_password_jwt_for_token = stepup_module.exchange_password_jwt_for_token
verify_password_for_stepup = stepup_module.verify_password_for_stepup


class TestVerifyPasswordWithJwt:
    """Tests for verify_password_with_jwt function"""

    @pytest.fixture
    def mock_http_client(self):
        """Create a mock HTTP client"""
        return AsyncMock(spec=AsyncClient)

    @pytest.mark.asyncio
    @patch("app.password.services.verify_password_stepup.get_cloud_directory_id")
    async def test_successful_password_verification(
        self, mock_get_cloud_dir_id, mock_http_client
    ):
        """Should successfully verify password and return user_id and JWT"""
        mock_get_cloud_dir_id.return_value = "cloud-dir-123"

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = '{"id": "user-123", "assertion": "password-jwt-token"}'
        mock_response.json.return_value = {
            "id": "user-123",
            "assertion": "password-jwt-token",
        }
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        user_id, password_jwt = await verify_password_with_jwt(
            http_client=mock_http_client,
            tenant_url="https://tenant.verify.ibm.com",
            verify_password_endpoint="https://tenant.verify.ibm.com/v2.0/authnmethods/password",
            admin_token="admin-token-123",
            username="user@example.com",
            password="SecurePass123!",
        )

        assert user_id == "user-123"
        assert password_jwt == "password-jwt-token"

        # Verify the POST call
        mock_http_client.post.assert_called_once()
        call_args = mock_http_client.post.call_args
        url = call_args[0][0]
        assert "cloud-dir-123" in url
        assert "returnJwt=true" in url

        # Verify request payload
        payload = call_args[1]["json"]
        assert payload["username"] == "user@example.com"
        assert payload["password"] == "SecurePass123!"

        # Verify auth header
        headers = call_args[1]["headers"]
        assert headers["Authorization"] == "Bearer admin-token-123"

    @pytest.mark.asyncio
    @patch("app.password.services.verify_password_stepup.get_cloud_directory_id")
    async def test_handles_invalid_password(
        self, mock_get_cloud_dir_id, mock_http_client
    ):
        """Should handle HTTP error when password is invalid"""
        mock_get_cloud_dir_id.return_value = "cloud-dir-123"

        mock_response = Response(401, json={"error": "Invalid credentials"})
        http_error = HTTPStatusError(
            "401 Unauthorized",
            request=MagicMock(spec=Request),
            response=mock_response,
        )
        mock_response_obj = MagicMock()
        mock_response_obj.raise_for_status.side_effect = http_error
        mock_http_client.post = AsyncMock(return_value=mock_response_obj)

        with pytest.raises(HTTPStatusError):
            await verify_password_with_jwt(
                http_client=mock_http_client,
                tenant_url="https://tenant.verify.ibm.com",
                verify_password_endpoint="https://tenant.verify.ibm.com/v2.0/authnmethods/password",
                admin_token="admin-token-123",
                username="user@example.com",
                password="WrongPassword",
            )

    @pytest.mark.asyncio
    @patch("app.password.services.verify_password_stepup.get_cloud_directory_id")
    async def test_handles_missing_user_id(
        self, mock_get_cloud_dir_id, mock_http_client
    ):
        """Should raise exception when user ID missing from response"""
        mock_get_cloud_dir_id.return_value = "cloud-dir-123"

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = '{"assertion": "password-jwt-token"}'
        mock_response.json.return_value = {
            "assertion": "password-jwt-token",
        }
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        with pytest.raises(Exception) as exc_info:
            await verify_password_with_jwt(
                http_client=mock_http_client,
                tenant_url="https://tenant.verify.ibm.com",
                verify_password_endpoint="https://tenant.verify.ibm.com/v2.0/authnmethods/password",
                admin_token="admin-token-123",
                username="user@example.com",
                password="Password123!",
            )

        assert "No user ID" in str(exc_info.value)

    @pytest.mark.asyncio
    @patch("app.password.services.verify_password_stepup.get_cloud_directory_id")
    async def test_handles_missing_jwt(self, mock_get_cloud_dir_id, mock_http_client):
        """Should raise exception when JWT missing from response"""
        mock_get_cloud_dir_id.return_value = "cloud-dir-123"

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = '{"id": "user-123"}'
        mock_response.json.return_value = {
            "id": "user-123",
        }
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        with pytest.raises(Exception) as exc_info:
            await verify_password_with_jwt(
                http_client=mock_http_client,
                tenant_url="https://tenant.verify.ibm.com",
                verify_password_endpoint="https://tenant.verify.ibm.com/v2.0/authnmethods/password",
                admin_token="admin-token-123",
                username="user@example.com",
                password="Password123!",
            )

        assert "No JWT" in str(exc_info.value)


class TestExchangePasswordJwtForToken:
    """Tests for exchange_password_jwt_for_token function"""

    @pytest.fixture
    def mock_http_client(self):
        """Create a mock HTTP client"""
        return AsyncMock(spec=AsyncClient)

    @pytest.mark.asyncio
    async def test_successful_jwt_bearer_exchange(self, mock_http_client):
        """Should successfully exchange password JWT for OAuth token"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = (
            '{"access_token": "stepup-token-123", "grant_id": "grant-456"}'
        )
        mock_response.json.return_value = {
            "access_token": "stepup-token-123",
            "grant_id": "grant-456",
            "token_type": "Bearer",
            "expires_in": 3600,
        }
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        result = await exchange_password_jwt_for_token(
            http_client=mock_http_client,
            tenant_url="https://tenant.verify.ibm.com",
            password_jwt="password-jwt-token",
            client_id="sts-client-id-123",
            client_secret="sts-client-secret-456",
        )

        assert result["access_token"] == "stepup-token-123"
        assert result["grant_id"] == "grant-456"

        # Verify the POST call
        mock_http_client.post.assert_called_once()
        call_args = mock_http_client.post.call_args
        url = call_args[0][0]
        assert "https://tenant.verify.ibm.com/oauth2/token" in url

        # Verify request data uses jwt-bearer grant
        data = call_args[1]["data"]
        assert data["grant_type"] == "urn:ietf:params:oauth:grant-type:jwt-bearer"
        assert data["assertion"] == "password-jwt-token"
        assert data["scope"] == "openid"

        # Verify headers include Basic auth with STS credentials
        headers = call_args[1]["headers"]
        assert "Authorization" in headers
        assert headers["Authorization"].startswith("Basic ")

    @pytest.mark.asyncio
    async def test_handles_invalid_grant_error(self, mock_http_client):
        """Should handle HTTP error when grant is invalid"""
        mock_response = Response(400, json={"error": "invalid_grant"})
        http_error = HTTPStatusError(
            "400 Bad Request",
            request=MagicMock(spec=Request),
            response=mock_response,
        )
        mock_response_obj = MagicMock()
        mock_response_obj.raise_for_status.side_effect = http_error
        mock_http_client.post = AsyncMock(return_value=mock_response_obj)

        with pytest.raises(HTTPStatusError):
            await exchange_password_jwt_for_token(
                http_client=mock_http_client,
                tenant_url="https://tenant.verify.ibm.com",
                password_jwt="invalid-jwt-token",
                client_id="sts-client-id-123",
                client_secret="sts-client-secret-456",
            )

    @pytest.mark.asyncio
    async def test_handles_missing_access_token(self, mock_http_client):
        """Should raise exception when access_token missing from response"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = '{"token_type": "Bearer"}'
        mock_response.json.return_value = {
            "token_type": "Bearer",
            "expires_in": 3600,
        }
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        with pytest.raises(Exception) as exc_info:
            await exchange_password_jwt_for_token(
                http_client=mock_http_client,
                tenant_url="https://tenant.verify.ibm.com",
                password_jwt="password-jwt-token",
                client_id="sts-client-id-123",
                client_secret="sts-client-secret-456",
            )

        assert "No access_token" in str(exc_info.value)


class TestVerifyPasswordForStepup:
    """Tests for verify_password_for_stepup main orchestrator function"""

    @pytest.fixture
    def mock_request(self):
        """Create a mock FastAPI Request object"""
        mock_req = MagicMock()
        mock_req.session = {}
        mock_req.app.state.request_client = AsyncMock(spec=AsyncClient)
        return mock_req

    @pytest.fixture
    def mock_password_payload(self):
        """Create mock password payload"""
        return UserPassword(password="SecurePass123!")

    @pytest.mark.asyncio
    @patch("app.password.services.verify_password_stepup.get_configuration")
    @patch(
        "app.password.services.verify_password_stepup.dispatch_get_my_profile_from_ibm"
    )
    @patch.object(stepup_module, "exchange_password_jwt_for_token")
    @patch.object(stepup_module, "verify_password_with_jwt")
    @patch.object(stepup_module, "get_admin_token")
    async def test_successful_complete_flow(
        self,
        mock_get_admin_token,
        mock_verify_password,
        mock_exchange_jwt,
        mock_get_profile,
        mock_get_config,
        mock_request,
        mock_password_payload,
    ):
        """Should complete entire 2-step flow successfully"""
        # Mock config
        mock_config = MagicMock()
        mock_config.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
            "https://tenant.verify.ibm.com"
        )
        mock_config.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID = (
            "profile-mgmt-client-123"
        )
        mock_config.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_SECRET = (
            "profile-mgmt-secret-456"
        )
        mock_config.verify_password_api_endpoint = (
            "https://tenant.verify.ibm.com/v2.0/authnmethods/password"
        )
        mock_get_config.return_value = mock_config

        # Mock user profile
        mock_user_info = MagicMock()
        mock_user_info.userName = "user@example.com"
        mock_get_profile.return_value = mock_user_info

        # Mock admin token
        mock_get_admin_token.return_value = "admin-token-123"

        # Mock step 1: password verification with JWT
        mock_verify_password.return_value = ("user-123", "password-jwt-token")

        # Mock step 2: JWT exchange
        mock_exchange_jwt.return_value = {
            "access_token": "stepup-token-456",
            "refresh_token": "stepup-refresh-789",
            "grant_id": "grant-abc",
            "expires_in": 3600,
        }

        result = await verify_password_for_stepup(
            request=mock_request,
            user_access_token="user-access-token",
            payload=mock_password_payload,
        )

        # Verify result
        assert result.success is True
        assert result.data.id == "user-123"
        assert "successfully" in result.message.lower()

        # Verify session storage uses new structure
        assert "stepup_token_data" in mock_request.session
        assert "stepup_token_timestamp" in mock_request.session
        assert (
            mock_request.session["stepup_token_data"]["access_token"]
            == "stepup-token-456"
        )
        assert mock_request.session["stepup_token_data"]["grant_id"] == "grant-abc"
        assert isinstance(mock_request.session["stepup_token_timestamp"], float)

        # Verify all steps were called
        mock_verify_password.assert_called_once()
        mock_exchange_jwt.assert_called_once()
