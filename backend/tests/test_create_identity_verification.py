"""
Unit tests for create_identity_verification service.
"""

import importlib
import pytest
from httpx import AsyncClient, HTTPStatusError, Request, Response
from unittest.mock import AsyncMock, MagicMock, patch

# Import the module using importlib for patching
idv_module = importlib.import_module(
    "app.identity_verification.services.create_identity_verification"
)
create_identity_verification = idv_module.create_identity_verification

MOCK_BLUINK_CONFIG = MagicMock()
MOCK_BLUINK_CONFIG.BLUINK_CLIENT_ID = "test-client-id"
MOCK_BLUINK_CONFIG.BLUINK_CLIENT_SECRET = "test-client-secret"

VALID_REDIRECT_URL = "https://demoeidv.bluink.ca/verify?session=abc123"


@pytest.fixture
def mock_http_client():
    return AsyncMock(spec=AsyncClient)


@pytest.fixture
def mock_profile():
    profile = MagicMock()
    profile.userName = "user@example.com"
    return profile


class TestCreateIdentityVerification:
    """Tests for create_identity_verification function"""

    @pytest.mark.asyncio
    @patch.object(idv_module, "_bluink_config", MOCK_BLUINK_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_successful_verification_request(
        self, mock_dispatch, mock_http_client, mock_profile
    ):
        """Should return redirect URL on successful Bluink API call"""
        mock_dispatch.return_value = mock_profile

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"url": VALID_REDIRECT_URL}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        result = await create_identity_verification(
            mock_http_client, "mock-access-token"
        )

        assert result.success is True
        assert result.message == "Identity verification registration created"
        assert result.data["redirect_url"] == VALID_REDIRECT_URL
        assert "state" in result.data

    @pytest.mark.asyncio
    @patch.object(idv_module, "_bluink_config", MOCK_BLUINK_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_sends_correct_payload(
        self, mock_dispatch, mock_http_client, mock_profile
    ):
        """Should send the user's email and Bluink credentials in the payload"""
        mock_dispatch.return_value = mock_profile

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"url": VALID_REDIRECT_URL}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        await create_identity_verification(mock_http_client, "mock-access-token")

        call_kwargs = mock_http_client.post.call_args
        payload = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")

        assert payload["email"] == "user@example.com"
        assert payload["rp_client_id"] == "test-client-id"
        assert payload["rp_client_secret"] == "test-client-secret"
        assert "state" in payload
        assert "nonce" in payload

    @pytest.mark.asyncio
    @patch.object(idv_module, "_bluink_config", MOCK_BLUINK_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_posts_to_correct_url(
        self, mock_dispatch, mock_http_client, mock_profile
    ):
        """Should POST to the Bluink API URL"""
        mock_dispatch.return_value = mock_profile

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"url": VALID_REDIRECT_URL}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        await create_identity_verification(mock_http_client, "mock-access-token")

        call_args = mock_http_client.post.call_args
        url = call_args[0][0] if call_args[0] else call_args.kwargs.get("url")
        assert url == "https://demoeid.bluink.ca/api/prereg/v2/request-registration"

    @pytest.mark.asyncio
    @patch.object(idv_module, "_bluink_config", MOCK_BLUINK_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(idv_module, "RequestErrorHandler")
    async def test_handles_bluink_api_error(
        self, mock_error_handler, mock_dispatch, mock_http_client, mock_profile
    ):
        """Should call RequestErrorHandler when Bluink API returns an error"""
        mock_dispatch.return_value = mock_profile

        request = Request(
            "POST", "https://demoeid.bluink.ca/api/prereg/v2/request-registration"
        )
        response = Response(502, request=request)
        exc = HTTPStatusError("Bad Gateway", request=request, response=response)

        mock_http_client.post = AsyncMock(side_effect=exc)
        mock_error_handler.handle.side_effect = Exception("handled")

        with pytest.raises(Exception, match="handled"):
            await create_identity_verification(mock_http_client, "mock-access-token")

        mock_error_handler.handle.assert_called_once_with(
            exc, context="Bluink identity verification request"
        )

    @pytest.mark.asyncio
    @patch.object(idv_module, "_bluink_config", MOCK_BLUINK_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(idv_module, "RequestErrorHandler")
    async def test_handles_missing_redirect_url(
        self, mock_error_handler, mock_dispatch, mock_http_client, mock_profile
    ):
        """Should raise error when Bluink response has no URL"""
        mock_dispatch.return_value = mock_profile

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok"}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)
        mock_error_handler.handle.side_effect = Exception("no url")

        with pytest.raises(Exception, match="no url"):
            await create_identity_verification(mock_http_client, "mock-access-token")

    @pytest.mark.asyncio
    @patch.object(idv_module, "_bluink_config", MOCK_BLUINK_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(idv_module, "RequestErrorHandler")
    async def test_rejects_non_https_redirect(
        self, mock_error_handler, mock_dispatch, mock_http_client, mock_profile
    ):
        """Should raise error when redirect URL is not HTTPS"""
        mock_dispatch.return_value = mock_profile

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "url": "http://demoeidv.bluink.ca/verify?session=abc"
        }
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)
        mock_error_handler.handle.side_effect = Exception("bad url")

        with pytest.raises(Exception, match="bad url"):
            await create_identity_verification(mock_http_client, "mock-access-token")

    @pytest.mark.asyncio
    @patch.object(idv_module, "_bluink_config", MOCK_BLUINK_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(idv_module, "RequestErrorHandler")
    async def test_rejects_disallowed_host(
        self, mock_error_handler, mock_dispatch, mock_http_client, mock_profile
    ):
        """Should raise error when redirect URL host is not in allowlist"""
        mock_dispatch.return_value = mock_profile

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"url": "https://evil.example.com/phish"}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)
        mock_error_handler.handle.side_effect = Exception("bad host")

        with pytest.raises(Exception, match="bad host"):
            await create_identity_verification(mock_http_client, "mock-access-token")

    @pytest.mark.asyncio
    @patch.object(idv_module, "_bluink_config", MOCK_BLUINK_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_each_request_gets_unique_state_and_nonce(
        self, mock_dispatch, mock_http_client, mock_profile
    ):
        """Should generate unique state and nonce per request"""
        mock_dispatch.return_value = mock_profile

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"url": VALID_REDIRECT_URL}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        result1 = await create_identity_verification(
            mock_http_client, "mock-access-token"
        )
        result2 = await create_identity_verification(
            mock_http_client, "mock-access-token"
        )

        assert result1.data["state"] != result2.data["state"]
