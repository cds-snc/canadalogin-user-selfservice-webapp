"""
Unit tests for FIDO2 get_fido2_registrations.py module

Tests get_user_fido2_registrations and get_user_response functions.
Uses importlib to import the actual module for patching.
"""

import importlib
import pytest
from fastapi import HTTPException, status
from httpx import AsyncClient, HTTPStatusError, Request, Response
from unittest.mock import AsyncMock, MagicMock, patch

# Import the module using importlib to get the actual module object
get_registrations_module = importlib.import_module(
    "app.fido2.services.get_fido2_registrations"
)

# Import functions directly for testing
get_user_fido2_registrations = get_registrations_module.get_user_fido2_registrations
get_user_response = get_registrations_module.get_user_response


class TestGetUserFido2Registrations:
    """Tests for get_user_fido2_registrations function"""

    @pytest.fixture
    def mock_http_client(self):
        """Create a mock HTTP client"""
        client = AsyncMock(spec=AsyncClient)
        return client

    @pytest.fixture
    def mock_registrations_response(self):
        """Create a mock FIDO2 registrations response"""
        return {
            "fido2": [
                {
                    "id": "reg-123",
                    "attributes": {
                        "nickname": "My Passkey",
                        "rpId": "example.com",
                        "credentialId": "cred-abc",
                    },
                    "enabled": True,
                    "created": "2024-01-15T10:30:00Z",
                },
                {
                    "id": "reg-456",
                    "attributes": {
                        "nickname": "Work Laptop",
                        "rpId": "example.com",
                        "credentialId": "cred-def",
                    },
                    "enabled": False,
                    "created": "2024-01-20T14:00:00Z",
                },
            ]
        }

    @pytest.mark.asyncio
    @patch.object(get_registrations_module, "get_auth_request_headers")
    @patch.object(get_registrations_module, "get_rp_uuid_from_rp_id")
    @patch.object(get_registrations_module, "get_admin_token")
    @patch.object(get_registrations_module, "get_user_profile_info")
    @patch.object(get_registrations_module, "get_rp_id")
    @patch.object(get_registrations_module, "get_tenant_url")
    async def test_successful_get_registrations(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_user_profile_info,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
        mock_registrations_response,
    ):
        """Should successfully retrieve FIDO2 registrations"""
        # Setup mocks
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer user-token"
        }

        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = mock_registrations_response
        mock_http_client.get = AsyncMock(return_value=mock_response)

        # Execute
        result = await get_user_fido2_registrations(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
        )

        # Verify
        assert result.success is True
        assert len(result.data) == 2
        assert result.data[0].id == "reg-123"
        assert result.data[0].nickname == "My Passkey"
        assert result.data[0].enabled is True
        assert result.data[1].id == "reg-456"
        assert result.data[1].enabled is False

    @pytest.mark.asyncio
    @patch.object(get_registrations_module, "get_auth_request_headers")
    @patch.object(get_registrations_module, "get_rp_uuid_from_rp_id")
    @patch.object(get_registrations_module, "get_admin_token")
    @patch.object(get_registrations_module, "get_user_profile_info")
    @patch.object(get_registrations_module, "get_rp_id")
    @patch.object(get_registrations_module, "get_tenant_url")
    async def test_returns_empty_list_when_no_registrations(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_user_profile_info,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should return empty list when user has no registrations"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer user-token"
        }

        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"fido2": []}
        mock_http_client.get = AsyncMock(return_value=mock_response)

        result = await get_user_fido2_registrations(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
        )

        assert result.success is True
        assert len(result.data) == 0
        assert result.message == "FIDO2 credentials retrieved successfully"

    @pytest.mark.asyncio
    @patch.object(get_registrations_module, "get_auth_request_headers")
    @patch.object(get_registrations_module, "get_rp_uuid_from_rp_id")
    @patch.object(get_registrations_module, "get_admin_token")
    @patch.object(get_registrations_module, "get_user_profile_info")
    @patch.object(get_registrations_module, "get_rp_id")
    @patch.object(get_registrations_module, "get_tenant_url")
    async def test_constructs_correct_search_filter(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_user_profile_info,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should construct correct search filter with userId and rpUuid"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer user-token"
        }

        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"fido2": []}
        mock_http_client.get = AsyncMock(return_value=mock_response)

        await get_user_fido2_registrations(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
        )

        # Verify the search params
        call_kwargs = mock_http_client.get.call_args[1]
        search_filter = call_kwargs["params"]["search"]
        assert 'userId="user-456"' in search_filter
        assert 'references/rpUuid="rp-uuid-123"' in search_filter

    @pytest.mark.asyncio
    @patch.object(get_registrations_module, "get_user_profile_info")
    @patch.object(get_registrations_module, "get_rp_id")
    @patch.object(get_registrations_module, "get_tenant_url")
    async def test_propagates_http_exception(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_user_profile_info,
        mock_http_client,
    ):
        """Should propagate HTTPException without wrapping"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_user_profile_info.side_effect = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

        with pytest.raises(HTTPException) as exc:
            await get_user_fido2_registrations(
                http_client=mock_http_client,
                user_access_token="invalid-token",
            )

        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    @patch.object(get_registrations_module, "RequestErrorHandler")
    @patch.object(get_registrations_module, "get_admin_token")
    @patch.object(get_registrations_module, "get_user_profile_info")
    @patch.object(get_registrations_module, "get_rp_id")
    @patch.object(get_registrations_module, "get_tenant_url")
    async def test_handles_admin_token_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_user_profile_info,
        mock_get_admin_token,
        mock_request_error_handler,
        mock_http_client,
    ):
        """Should handle error when getting admin token fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_admin_token.side_effect = Exception("Token service error")

        await get_user_fido2_registrations(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
        )

        mock_request_error_handler.handle.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(get_registrations_module, "RequestErrorHandler")
    @patch.object(get_registrations_module, "get_auth_request_headers")
    @patch.object(get_registrations_module, "get_rp_uuid_from_rp_id")
    @patch.object(get_registrations_module, "get_admin_token")
    @patch.object(get_registrations_module, "get_user_profile_info")
    @patch.object(get_registrations_module, "get_rp_id")
    @patch.object(get_registrations_module, "get_tenant_url")
    async def test_handles_http_get_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_user_profile_info,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_request_error_handler,
        mock_http_client,
    ):
        """Should handle error when HTTP GET request fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer user-token"
        }

        mock_request = Request(
            "GET", "https://tenant.verify.ibm.com/v2.0/factors/fido2/registrations"
        )
        mock_response = Response(500, request=mock_request)
        mock_get_response = MagicMock()
        mock_get_response.raise_for_status.side_effect = HTTPStatusError(
            message="Server Error",
            request=mock_request,
            response=mock_response,
        )
        mock_http_client.get = AsyncMock(return_value=mock_get_response)

        await get_user_fido2_registrations(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
        )

        mock_request_error_handler.handle.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(get_registrations_module, "get_auth_request_headers")
    @patch.object(get_registrations_module, "get_rp_uuid_from_rp_id")
    @patch.object(get_registrations_module, "get_admin_token")
    @patch.object(get_registrations_module, "get_user_profile_info")
    @patch.object(get_registrations_module, "get_rp_id")
    @patch.object(get_registrations_module, "get_tenant_url")
    async def test_handles_missing_attributes(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_user_profile_info,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should handle registrations with missing attributes"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer user-token"
        }

        # Registration with minimal data
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            "fido2": [
                {
                    "id": "reg-minimal",
                    # No attributes, no enabled, no created
                }
            ]
        }
        mock_http_client.get = AsyncMock(return_value=mock_response)

        result = await get_user_fido2_registrations(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
        )

        assert result.success is True
        assert len(result.data) == 1
        assert result.data[0].id == "reg-minimal"
        assert result.data[0].nickname is None
        assert result.data[0].enabled is False

    @pytest.mark.asyncio
    @patch.object(get_registrations_module, "get_auth_request_headers")
    @patch.object(get_registrations_module, "get_rp_uuid_from_rp_id")
    @patch.object(get_registrations_module, "get_admin_token")
    @patch.object(get_registrations_module, "get_user_profile_info")
    @patch.object(get_registrations_module, "get_rp_id")
    @patch.object(get_registrations_module, "get_tenant_url")
    async def test_handles_missing_fido2_key(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_user_profile_info,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should handle response with missing fido2 key"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer user-token"
        }

        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {}  # No fido2 key
        mock_http_client.get = AsyncMock(return_value=mock_response)

        result = await get_user_fido2_registrations(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
        )

        assert result.success is True
        assert len(result.data) == 0


class TestGetUserResponse:
    """Tests for get_user_response function"""

    @pytest.fixture
    def mock_http_client(self):
        """Create a mock HTTP client"""
        return AsyncMock(spec=AsyncClient)

    @pytest.fixture
    def mock_credentials_list(self):
        """Create mock FIDO2CredentialSummary objects"""
        from app.fido2.schemas import FIDO2CredentialSummary

        return [
            FIDO2CredentialSummary(
                id="reg-123",
                nickname="My Passkey",
                enabled=True,
                created="2024-01-15T10:30:00Z",
            ),
            FIDO2CredentialSummary(
                id="reg-456",
                nickname="Work Laptop",
                enabled=False,
                created="2024-01-20T14:00:00Z",
            ),
        ]

    @pytest.mark.asyncio
    @patch.object(get_registrations_module, "get_user_fido2_registrations")
    async def test_successful_get_user_response(
        self,
        mock_get_user_fido2_registrations,
        mock_http_client,
        mock_credentials_list,
    ):
        """Should successfully return user response with credentials"""
        # Create mock credentials response with proper Pydantic objects
        mock_credentials = MagicMock()
        mock_credentials.data = mock_credentials_list
        mock_get_user_fido2_registrations.return_value = mock_credentials

        result = await get_user_response(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
        )

        assert result.success is True
        assert result.data.authenticated is True
        assert len(result.data.credentials) == 2
        assert result.message == "User FIDO2 data retrieved successfully"

    @pytest.mark.asyncio
    @patch.object(get_registrations_module, "get_user_fido2_registrations")
    async def test_returns_empty_credentials_list(
        self,
        mock_get_user_fido2_registrations,
        mock_http_client,
    ):
        """Should return empty credentials list when user has none"""
        mock_credentials = MagicMock()
        mock_credentials.data = []
        mock_get_user_fido2_registrations.return_value = mock_credentials

        result = await get_user_response(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
        )

        assert result.success is True
        assert result.data.authenticated is True
        assert len(result.data.credentials) == 0

    @pytest.mark.asyncio
    @patch.object(get_registrations_module, "get_user_fido2_registrations")
    async def test_handles_none_data(
        self,
        mock_get_user_fido2_registrations,
        mock_http_client,
    ):
        """Should handle None data from get_user_fido2_registrations"""
        mock_credentials = MagicMock()
        mock_credentials.data = None
        mock_get_user_fido2_registrations.return_value = mock_credentials

        result = await get_user_response(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
        )

        assert result.success is True
        assert result.data.credentials == []

    @pytest.mark.asyncio
    @patch.object(get_registrations_module, "RequestErrorHandler")
    @patch.object(get_registrations_module, "get_user_fido2_registrations")
    async def test_handles_registrations_error(
        self,
        mock_get_user_fido2_registrations,
        mock_request_error_handler,
        mock_http_client,
    ):
        """Should handle error from get_user_fido2_registrations"""
        mock_get_user_fido2_registrations.side_effect = Exception(
            "Failed to get registrations"
        )

        await get_user_response(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
        )

        mock_request_error_handler.handle.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(get_registrations_module, "get_user_fido2_registrations")
    async def test_sets_username_and_displayname_to_none(
        self,
        mock_get_user_fido2_registrations,
        mock_http_client,
    ):
        """Should set username and displayName to None"""
        mock_credentials = MagicMock()
        mock_credentials.data = []
        mock_get_user_fido2_registrations.return_value = mock_credentials

        result = await get_user_response(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
        )

        assert result.data.username is None
        assert result.data.displayName is None
