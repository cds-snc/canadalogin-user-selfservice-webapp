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
                    "userId": "user-456",
                    "type": "fido2",
                    "created": "2024-01-15T10:30:00Z",
                    "updated": "2024-01-15T10:30:00Z",
                    "enabled": True,
                    "validated": True,
                    "attributes": {
                        "nickname": "My Passkey",
                        "rpId": "example.com",
                        "credentialId": "cred-abc",
                    },
                    "references": {"rpUuid": "rp-uuid-123"},
                },
                {
                    "id": "reg-456",
                    "userId": "user-456",
                    "type": "fido2",
                    "created": "2024-01-20T14:00:00Z",
                    "updated": "2024-01-20T14:00:00Z",
                    "enabled": False,
                    "validated": True,
                    "attributes": {
                        "nickname": "Work Laptop",
                        "rpId": "example.com",
                        "credentialId": "cred-def",
                    },
                    "references": {"rpUuid": "rp-uuid-123"},
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
        assert result.data is not None
        assert len(result.data.fido2) == 2
        assert result.data.fido2[0].id == "reg-123"
        assert result.data.fido2[0].attributes["nickname"] == "My Passkey"
        assert result.data.fido2[0].enabled is True
        assert result.data.fido2[1].id == "reg-456"
        assert result.data.fido2[1].enabled is False

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
        assert result.data is not None
        assert len(result.data.fido2) == 0
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

        # Registration with minimal data but all required fields
        minimal_registration = {
            "fido2": [
                {
                    "id": "reg-789",
                    "userId": "user-456",
                    "type": "fido2",
                    "created": "2024-01-25T09:00:00Z",
                    "updated": "2024-01-25T09:00:00Z",
                    "enabled": True,
                    "validated": False,
                    "attributes": {},
                    "references": {},
                }
            ]
        }
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = minimal_registration
        mock_http_client.get = AsyncMock(return_value=mock_response)

        # Execute
        result = await get_user_fido2_registrations(
            http_client=mock_http_client,
            user_access_token="user-token-abc",
        )

        # Verify - should handle empty attributes/references
        assert result.success is True
        assert result.data is not None
        assert len(result.data.fido2) == 1
        assert result.data.fido2[0].id == "reg-789"
        assert result.data.fido2[0].attributes == {}
        assert result.data.fido2[0].references == {}
