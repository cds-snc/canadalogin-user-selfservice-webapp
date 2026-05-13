"""
Unit tests for send_in_person_verification_code service.
"""

import importlib

import pytest
from fastapi import HTTPException
from httpx import AsyncClient, HTTPStatusError, Request, Response, TimeoutException
from unittest.mock import AsyncMock, MagicMock, patch

# Import via importlib so patch.object targets the module's own namespace
idv_module = importlib.import_module(
    "app.identity_verification.services.send_in_person_verification_code"
)
send_in_person_verification_code = idv_module.send_in_person_verification_code

MOCK_GC_NOTIFY_CONFIG = MagicMock()
MOCK_GC_NOTIFY_CONFIG.GC_NOTIFY_API_KEY = "test-api-key"

GC_NOTIFY_EMAIL_ENDPOINT = idv_module.GC_NOTIFY_EMAIL_ENDPOINT
GC_NOTIFY_TEMPLATE_ID = idv_module.GC_NOTIFY_TEMPLATE_ID
HARDCODED_VERIFICATION_CODE = idv_module.HARDCODED_VERIFICATION_CODE


def make_http_status_error(
    status_code: int, json_body: dict | None = None
) -> HTTPStatusError:
    request = Request("POST", GC_NOTIFY_EMAIL_ENDPOINT)
    response = Response(status_code, request=request, json=json_body or {})
    return HTTPStatusError(str(status_code), request=request, response=response)


@pytest.fixture
def mock_http_client():
    return AsyncMock(spec=AsyncClient)


@pytest.fixture
def mock_profile():
    profile = MagicMock()
    profile.userName = "user@example.com"
    return profile


@pytest.fixture
def mock_success_response():
    response = MagicMock()
    response.status_code = 201
    response.json.return_value = {"id": "740e5834-3a29-46b4-9a6f-16142fde533a"}
    response.raise_for_status = MagicMock()
    return response


class TestSendInPersonVerificationCode:
    """Tests for send_in_person_verification_code function."""

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_successful_email_send(
        self, mock_dispatch, mock_http_client, mock_profile, mock_success_response
    ):
        """Should return a success ResponseModel when GC Notify accepts the request."""
        mock_dispatch.return_value = mock_profile
        mock_http_client.post = AsyncMock(return_value=mock_success_response)

        result = await send_in_person_verification_code(
            mock_http_client, "mock-access-token"
        )

        assert result.success is True
        assert result.message == "In-person verification email sent"
        assert result.data["email_address"] == "user@example.com"

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_posts_to_correct_endpoint(
        self, mock_dispatch, mock_http_client, mock_profile, mock_success_response
    ):
        """Should POST to the GC Notify email endpoint."""
        mock_dispatch.return_value = mock_profile
        mock_http_client.post = AsyncMock(return_value=mock_success_response)

        await send_in_person_verification_code(mock_http_client, "mock-access-token")

        call_args = mock_http_client.post.call_args
        url = call_args[0][0] if call_args[0] else call_args.kwargs.get("url")
        assert url == GC_NOTIFY_EMAIL_ENDPOINT

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_sends_correct_authorization_header(
        self, mock_dispatch, mock_http_client, mock_profile, mock_success_response
    ):
        """Should set the Authorization header in the ApiKey-v1 format."""
        mock_dispatch.return_value = mock_profile
        mock_http_client.post = AsyncMock(return_value=mock_success_response)

        await send_in_person_verification_code(mock_http_client, "mock-access-token")

        call_kwargs = mock_http_client.post.call_args.kwargs
        headers = call_kwargs.get("headers") or mock_http_client.post.call_args[1].get(
            "headers"
        )
        expected_key = MOCK_GC_NOTIFY_CONFIG.GC_NOTIFY_API_KEY
        assert headers["Authorization"] == f"ApiKey-v1 {expected_key}"
        assert headers["Content-Type"] == "application/json"

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_sends_correct_payload(
        self, mock_dispatch, mock_http_client, mock_profile, mock_success_response
    ):
        """Should send the user email, correct template ID, and verification code."""
        mock_dispatch.return_value = mock_profile
        mock_http_client.post = AsyncMock(return_value=mock_success_response)

        await send_in_person_verification_code(mock_http_client, "mock-access-token")

        call_kwargs = mock_http_client.post.call_args.kwargs
        payload = call_kwargs.get("json") or mock_http_client.post.call_args[1].get(
            "json"
        )
        assert payload["email_address"] == "user@example.com"
        assert payload["template_id"] == GC_NOTIFY_TEMPLATE_ID
        assert (
            payload["personalisation"]["verification_code"]
            == HARDCODED_VERIFICATION_CODE
        )

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_fetches_email_from_user_profile(
        self, mock_dispatch, mock_http_client, mock_profile, mock_success_response
    ):
        """Should resolve the recipient email from the user's IBM Verify profile."""
        mock_dispatch.return_value = mock_profile
        mock_http_client.post = AsyncMock(return_value=mock_success_response)

        await send_in_person_verification_code(mock_http_client, "mock-access-token")

        mock_dispatch.assert_called_once_with(mock_http_client, "mock-access-token")

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_raises_when_profile_lookup_fails(
        self, mock_dispatch, mock_http_client
    ):
        """Should propagate exceptions from the profile lookup."""
        mock_dispatch.side_effect = HTTPException(
            status_code=401, detail="Unauthorized"
        )

        with pytest.raises(HTTPException) as exc_info:
            await send_in_person_verification_code(mock_http_client, "bad-token")

        assert exc_info.value.status_code == 401
        mock_http_client.post.assert_not_called()

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_raises_on_400_from_gc_notify(
        self, mock_dispatch, mock_http_client, mock_profile
    ):
        """Should raise HTTP 400 when GC Notify rejects the request."""
        mock_dispatch.return_value = mock_profile
        exc = make_http_status_error(400, {"messageId": "BadRequestError"})
        mock_http_client.post = AsyncMock(side_effect=exc)

        with pytest.raises(HTTPException) as exc_info:
            await send_in_person_verification_code(
                mock_http_client, "mock-access-token"
            )

        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_raises_on_429_from_gc_notify(
        self, mock_dispatch, mock_http_client, mock_profile
    ):
        """Should raise HTTP 429 when GC Notify rate-limits the request."""
        mock_dispatch.return_value = mock_profile
        exc = make_http_status_error(429, {"messageId": "RateLimitError"})
        mock_http_client.post = AsyncMock(side_effect=exc)

        with pytest.raises(HTTPException) as exc_info:
            await send_in_person_verification_code(
                mock_http_client, "mock-access-token"
            )

        assert exc_info.value.status_code == 429

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_raises_on_5xx_from_gc_notify(
        self, mock_dispatch, mock_http_client, mock_profile
    ):
        """Should raise an HTTPException when GC Notify returns a server error."""
        mock_dispatch.return_value = mock_profile
        exc = make_http_status_error(500)
        mock_http_client.post = AsyncMock(side_effect=exc)

        with pytest.raises(HTTPException) as exc_info:
            await send_in_person_verification_code(
                mock_http_client, "mock-access-token"
            )

        assert exc_info.value.status_code == 500

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_raises_on_timeout(
        self, mock_dispatch, mock_http_client, mock_profile
    ):
        """Should raise HTTP 504 when the GC Notify request times out."""
        mock_dispatch.return_value = mock_profile
        mock_http_client.post = AsyncMock(side_effect=TimeoutException("timed out"))

        with pytest.raises(HTTPException) as exc_info:
            await send_in_person_verification_code(
                mock_http_client, "mock-access-token"
            )

        assert exc_info.value.status_code == 504

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_raises_on_unexpected_exception(
        self, mock_dispatch, mock_http_client, mock_profile
    ):
        """Should raise HTTP 500 on any unexpected exception during the GC Notify call."""
        mock_dispatch.return_value = mock_profile
        mock_http_client.post = AsyncMock(side_effect=Exception("unexpected"))

        with pytest.raises(HTTPException) as exc_info:
            await send_in_person_verification_code(
                mock_http_client, "mock-access-token"
            )

        assert exc_info.value.status_code == 500

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_uses_timeout_on_post(
        self, mock_dispatch, mock_http_client, mock_profile, mock_success_response
    ):
        """Should set a request timeout when calling GC Notify."""
        mock_dispatch.return_value = mock_profile
        mock_http_client.post = AsyncMock(return_value=mock_success_response)

        await send_in_person_verification_code(mock_http_client, "mock-access-token")

        call_kwargs = mock_http_client.post.call_args.kwargs
        assert call_kwargs.get("timeout") is not None

    @pytest.mark.asyncio
    async def test_raises_when_api_key_not_configured(self, mock_http_client):
        """Should raise HTTP 500 and not call the profile service when GC_NOTIFY_API_KEY is missing."""
        missing_key_config = MagicMock()
        missing_key_config.GC_NOTIFY_API_KEY = None

        with patch.object(idv_module, "_gc_notify_config", missing_key_config):
            with pytest.raises(HTTPException) as exc_info:
                await send_in_person_verification_code(
                    mock_http_client, "mock-access-token"
                )

        assert exc_info.value.status_code == 500
        mock_http_client.post.assert_not_called()
