"""
Unit tests for FIDO2 add_fido2_registration.py module

Tests the get_attestation_options and submit_attestation_result functions.
Uses importlib to import the actual module for patching.
"""

import importlib
import pytest
from httpx import AsyncClient, HTTPStatusError, Request, Response
from unittest.mock import AsyncMock, MagicMock, patch
from app.fido2.schemas import AttestationOptionsRequest

# Import the module using importlib to get the actual module object
add_module = importlib.import_module("app.fido2.services.add_fido2_registration")

# Import functions directly for testing
_prepare_attestation_result_body = add_module._prepare_attestation_result_body
get_attestation_options = add_module.get_attestation_options
submit_attestation_result = add_module.submit_attestation_result


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


class TestGetAttestationOptions:
    """Tests for get_attestation_options function"""

    @pytest.fixture
    def mock_http_client(self):
        """Create a mock HTTP client"""
        return AsyncMock(spec=AsyncClient)

    @pytest.mark.asyncio
    @patch.object(add_module, "get_auth_request_headers")
    @patch.object(add_module, "get_user_profile_info")
    @patch.object(add_module, "get_rp_uuid_from_rp_id")
    @patch.object(add_module, "get_admin_token")
    @patch.object(add_module, "get_rp_id")
    @patch.object(add_module, "get_tenant_url")
    async def test_successful_attestation_options(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_profile_info,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should successfully get attestation options"""
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
            "rp": {"name": "Example"},
        }
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        request_data = AttestationOptionsRequest()
        result = await get_attestation_options(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_data=request_data,
        )

        assert result.success is True
        assert result.data["challenge"] == "abc123"
        assert result.message == "Attestation options retrieved successfully"
        mock_get_user_profile_info.assert_called_once_with(
            mock_http_client, "user-token"
        )

    @pytest.mark.asyncio
    @patch.object(add_module, "get_auth_request_headers")
    @patch.object(add_module, "get_user_profile_info")
    @patch.object(add_module, "get_rp_uuid_from_rp_id")
    @patch.object(add_module, "get_admin_token")
    @patch.object(add_module, "get_rp_id")
    @patch.object(add_module, "get_tenant_url")
    async def test_injects_user_profile(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_profile_info,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should inject displayName and userId into request body"""
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

        request_data = AttestationOptionsRequest()
        await get_attestation_options(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_data=request_data,
        )

        # Verify the body sent to the API includes displayName and userId
        call_kwargs = mock_http_client.post.call_args[1]
        sent_body = call_kwargs["json"]
        assert sent_body["displayName"] == "Display Name"
        assert sent_body["userId"] == "user-123"

    @pytest.mark.asyncio
    @patch.object(add_module, "get_auth_request_headers")
    @patch.object(add_module, "get_user_profile_info")
    @patch.object(add_module, "get_rp_uuid_from_rp_id")
    @patch.object(add_module, "get_admin_token")
    @patch.object(add_module, "get_rp_id")
    @patch.object(add_module, "get_tenant_url")
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
        """Should call the correct attestation/options endpoint"""
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

        request_data = AttestationOptionsRequest()
        await get_attestation_options(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_data=request_data,
        )

        call_args = mock_http_client.post.call_args[0]
        url = call_args[0]
        assert (
            "/v2.0/factors/fido2/relyingparties/rp-uuid-123/attestation/options" in url
        )


    @pytest.mark.asyncio
    @patch.object(add_module, "get_auth_request_headers")
    @patch.object(add_module, "get_user_profile_info")
    @patch.object(add_module, "get_rp_uuid_from_rp_id")
    @patch.object(add_module, "get_admin_token")
    @patch.object(add_module, "get_rp_id")
    @patch.object(add_module, "get_tenant_url")
    async def test_handles_none_request_body(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_profile_info,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should handle None request body"""
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

        request_data = AttestationOptionsRequest()
        result = await get_attestation_options(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_data=request_data,
        )

        assert result.success is True


class TestSubmitAttestationResult:
    """Tests for submit_attestation_result function"""

    @pytest.fixture
    def mock_http_client(self):
        """Create a mock HTTP client"""
        return AsyncMock(spec=AsyncClient)

    @pytest.mark.asyncio
    @patch.object(add_module, "get_auth_request_headers")
    @patch.object(add_module, "get_rp_uuid_from_rp_id")
    @patch.object(add_module, "get_admin_token")
    @patch.object(add_module, "get_rp_id")
    @patch.object(add_module, "get_tenant_url")
    async def test_successful_attestation_result(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should successfully submit attestation result"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok", "id": "registration-123"}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        result = await submit_attestation_result(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body={
                "id": "credential-id",
                "rawId": "raw-id",
                "type": "public-key",
            },
        )

        assert result.success is True
        assert result.message == "FIDO2 registration completed successfully"

    @pytest.mark.asyncio
    @patch.object(add_module, "get_auth_request_headers")
    @patch.object(add_module, "get_rp_uuid_from_rp_id")
    @patch.object(add_module, "get_admin_token")
    @patch.object(add_module, "get_rp_id")
    @patch.object(add_module, "get_tenant_url")
    async def test_adds_enabled_true(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should add enabled: true to request body"""
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

        await submit_attestation_result(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body={"id": "credential-id"},
        )

        call_kwargs = mock_http_client.post.call_args[1]
        sent_body = call_kwargs["json"]
        assert sent_body["enabled"] is True

    @pytest.mark.asyncio
    @patch.object(add_module, "get_auth_request_headers")
    @patch.object(add_module, "get_rp_uuid_from_rp_id")
    @patch.object(add_module, "get_admin_token")
    @patch.object(add_module, "get_rp_id")
    @patch.object(add_module, "get_tenant_url")
    async def test_handles_null_client_extension_results(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should set getClientExtensionResults to empty dict if None"""
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

        await submit_attestation_result(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body={"id": "credential-id", "getClientExtensionResults": None},
        )

        call_kwargs = mock_http_client.post.call_args[1]
        sent_body = call_kwargs["json"]
        assert sent_body["getClientExtensionResults"] == {}

    @pytest.mark.asyncio
    @patch.object(add_module, "get_auth_request_headers")
    @patch.object(add_module, "get_rp_uuid_from_rp_id")
    @patch.object(add_module, "get_admin_token")
    @patch.object(add_module, "get_rp_id")
    @patch.object(add_module, "get_tenant_url")
    async def test_calls_correct_endpoint(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should call the correct attestation/result endpoint"""
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

        await submit_attestation_result(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body={"id": "credential-id"},
        )

        call_args = mock_http_client.post.call_args[0]
        url = call_args[0]
        assert (
            "/v2.0/factors/fido2/relyingparties/rp-uuid-123/attestation/result" in url
        )
        

    @pytest.mark.asyncio
    @patch.object(add_module, "get_auth_request_headers")
    @patch.object(add_module, "get_rp_uuid_from_rp_id")
    @patch.object(add_module, "get_admin_token")
    @patch.object(add_module, "get_rp_id")
    @patch.object(add_module, "get_tenant_url")
    async def test_handles_none_request_body(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should handle None request body"""
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

        result = await submit_attestation_result(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body=None,
        )

        assert result.success is True

    @pytest.mark.asyncio
    @patch.object(add_module, "get_auth_request_headers")
    @patch.object(add_module, "get_rp_uuid_from_rp_id")
    @patch.object(add_module, "get_admin_token")
    @patch.object(add_module, "get_rp_id")
    @patch.object(add_module, "get_tenant_url")
    async def test_preserves_existing_client_extension_results(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_http_client,
    ):
        """Should preserve existing getClientExtensionResults"""
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

        await submit_attestation_result(
            http_client=mock_http_client,
            user_access_token="user-token",
            request_body={
                "id": "credential-id",
                "getClientExtensionResults": {"credProtect": 1},
            },
        )

        call_kwargs = mock_http_client.post.call_args[1]
        sent_body = call_kwargs["json"]
        assert sent_body["getClientExtensionResults"] == {"credProtect": 1}
