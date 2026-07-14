"""
Unit tests for send_in_person_verification_code service.
"""

import importlib
import json
from datetime import UTC, datetime, timedelta

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
GC_NOTIFY_TEMPLATE_ID = idv_module.GCNotifyTemplateID.IN_PERSON_VERIFICATION
GENERATED_VERIFICATION_CODE = "AB12CD34EF"


def make_generated_payload() -> MagicMock:
    payload = MagicMock()
    payload.identifier = GENERATED_VERIFICATION_CODE
    payload.identifier_hash = "hash"
    payload.salt = "salt"
    payload.created_at = datetime.now(UTC)
    payload.expires_at = payload.created_at + timedelta(days=30)
    payload.validity_days = 30
    payload.hash_algorithm = "PBKDF2-HMAC-SHA256"
    payload.pbkdf2_iterations = 210_000
    return payload


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


@pytest.fixture
def mock_request():
    request = MagicMock()
    request.headers = {}
    request.client = MagicMock()
    request.client.host = "203.0.113.10"

    redis_client = AsyncMock()
    redis_client.incr = AsyncMock(return_value=1)
    redis_client.expire = AsyncMock(return_value=True)
    redis_client.get = AsyncMock(return_value=None)
    redis_client.ttl = AsyncMock(return_value=-1)
    redis_client.setex = AsyncMock(return_value=True)
    redis_client.delete = AsyncMock(return_value=1)

    request.app.state.redis_client = redis_client
    return request


class TestSendInPersonVerificationCode:
    """Tests for send_in_person_verification_code function."""

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "generate_unique_verification_code")
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_successful_email_send(
        self,
        mock_dispatch,
        mock_generate_code,
        mock_http_client,
        mock_profile,
        mock_success_response,
    ):
        """Should return a success ResponseModel when GC Notify accepts the request."""
        mock_dispatch.return_value = mock_profile
        mock_generate_code.return_value = make_generated_payload()
        mock_http_client.post = AsyncMock(return_value=mock_success_response)

        result = await send_in_person_verification_code(
            mock_http_client, "mock-access-token"
        )

        assert result.success is True
        assert result.message == "In-person verification email sent"
        assert result.data["verification_code"] == GENERATED_VERIFICATION_CODE
        assert result.data["verification_expires_at"] == (
            mock_generate_code.return_value.expires_at.isoformat()
        )
        assert result.data["verification_validity_days"] == 30
        assert "sent_at" in result.data
        assert datetime.fromisoformat(result.data["sent_at"]).tzinfo is not None

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "generate_unique_verification_code")
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_posts_to_correct_endpoint(
        self,
        mock_dispatch,
        mock_generate_code,
        mock_http_client,
        mock_profile,
        mock_success_response,
    ):
        """Should POST to the GC Notify email endpoint."""
        mock_dispatch.return_value = mock_profile
        mock_generate_code.return_value = make_generated_payload()
        mock_http_client.post = AsyncMock(return_value=mock_success_response)

        await send_in_person_verification_code(mock_http_client, "mock-access-token")

        call_args = mock_http_client.post.call_args
        url = call_args[0][0] if call_args[0] else call_args.kwargs.get("url")
        assert url == GC_NOTIFY_EMAIL_ENDPOINT

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "generate_unique_verification_code")
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_sends_correct_authorization_header(
        self,
        mock_dispatch,
        mock_generate_code,
        mock_http_client,
        mock_profile,
        mock_success_response,
    ):
        """Should set the Authorization header in the ApiKey-v1 format."""
        mock_dispatch.return_value = mock_profile
        mock_generate_code.return_value = make_generated_payload()
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
    @patch.object(idv_module, "generate_unique_verification_code")
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_sends_correct_payload(
        self,
        mock_dispatch,
        mock_generate_code,
        mock_http_client,
        mock_profile,
        mock_success_response,
    ):
        """Should send the user email, correct template ID, and verification code."""
        mock_dispatch.return_value = mock_profile
        mock_generate_code.return_value = make_generated_payload()
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
            == GENERATED_VERIFICATION_CODE
        )
        mock_generate_code.assert_called_once()

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "generate_unique_verification_code")
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_fetches_email_from_user_profile(
        self,
        mock_dispatch,
        mock_generate_code,
        mock_http_client,
        mock_profile,
        mock_success_response,
    ):
        """Should resolve the recipient email from the user's IBM Verify profile."""
        mock_dispatch.return_value = mock_profile
        mock_generate_code.return_value = make_generated_payload()
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
    @patch.object(idv_module, "generate_unique_verification_code")
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_raises_on_400_from_gc_notify(
        self, mock_dispatch, mock_generate_code, mock_http_client, mock_profile
    ):
        """Should raise HTTP 400 when GC Notify rejects the request."""
        mock_dispatch.return_value = mock_profile
        mock_generate_code.return_value = make_generated_payload()
        exc = make_http_status_error(400, {"messageId": "BadRequestError"})
        mock_http_client.post = AsyncMock(side_effect=exc)

        with pytest.raises(HTTPException) as exc_info:
            await send_in_person_verification_code(
                mock_http_client, "mock-access-token"
            )

        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "generate_unique_verification_code")
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_raises_on_429_from_gc_notify(
        self, mock_dispatch, mock_generate_code, mock_http_client, mock_profile
    ):
        """Should raise HTTP 429 when GC Notify rate-limits the request."""
        mock_dispatch.return_value = mock_profile
        mock_generate_code.return_value = make_generated_payload()
        exc = make_http_status_error(429, {"messageId": "RateLimitError"})
        mock_http_client.post = AsyncMock(side_effect=exc)

        with pytest.raises(HTTPException) as exc_info:
            await send_in_person_verification_code(
                mock_http_client, "mock-access-token"
            )

        assert exc_info.value.status_code == 429

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "generate_unique_verification_code")
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_raises_on_5xx_from_gc_notify(
        self, mock_dispatch, mock_generate_code, mock_http_client, mock_profile
    ):
        """Should raise an HTTPException when GC Notify returns a server error."""
        mock_dispatch.return_value = mock_profile
        mock_generate_code.return_value = make_generated_payload()
        exc = make_http_status_error(500)
        mock_http_client.post = AsyncMock(side_effect=exc)

        with pytest.raises(HTTPException) as exc_info:
            await send_in_person_verification_code(
                mock_http_client, "mock-access-token"
            )

        assert exc_info.value.status_code == 500

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "generate_unique_verification_code")
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_raises_on_timeout(
        self, mock_dispatch, mock_generate_code, mock_http_client, mock_profile
    ):
        """Should raise HTTP 504 when the GC Notify request times out."""
        mock_dispatch.return_value = mock_profile
        mock_generate_code.return_value = make_generated_payload()
        mock_http_client.post = AsyncMock(side_effect=TimeoutException("timed out"))

        with pytest.raises(HTTPException) as exc_info:
            await send_in_person_verification_code(
                mock_http_client, "mock-access-token"
            )

        assert exc_info.value.status_code == 504

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "generate_unique_verification_code")
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_raises_on_unexpected_exception(
        self, mock_dispatch, mock_generate_code, mock_http_client, mock_profile
    ):
        """Should raise HTTP 500 on any unexpected exception during the GC Notify call."""
        mock_dispatch.return_value = mock_profile
        mock_generate_code.return_value = make_generated_payload()
        mock_http_client.post = AsyncMock(side_effect=Exception("unexpected"))

        with pytest.raises(HTTPException) as exc_info:
            await send_in_person_verification_code(
                mock_http_client, "mock-access-token"
            )

        assert exc_info.value.status_code == 500

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "generate_unique_verification_code")
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_uses_timeout_on_post(
        self,
        mock_dispatch,
        mock_generate_code,
        mock_http_client,
        mock_profile,
        mock_success_response,
    ):
        """Should set a request timeout when calling GC Notify."""
        mock_dispatch.return_value = mock_profile
        mock_generate_code.return_value = make_generated_payload()
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

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "generate_unique_verification_code")
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_reuses_active_unexpired_code_when_available(
        self,
        mock_dispatch,
        mock_generate_code,
        mock_http_client,
        mock_profile,
        mock_success_response,
        mock_request,
    ):
        """Should reuse an active Redis-cached code instead of generating a new one."""
        mock_dispatch.return_value = mock_profile
        mock_http_client.post = AsyncMock(return_value=mock_success_response)

        future_expiry = datetime.now(UTC) + timedelta(days=10)
        cached_payload = {
            "verification_code": "CACHED12345",
            "expires_at": future_expiry.isoformat(),
            "validity_days": 30,
        }
        mock_request.app.state.redis_client.get = AsyncMock(
            side_effect=[None, json.dumps(cached_payload)]
        )

        result = await send_in_person_verification_code(
            mock_http_client,
            "mock-access-token",
            request=mock_request,
        )

        assert result.data["verification_code"] == "CACHED12345"
        assert result.data["verification_expires_at"] == future_expiry.isoformat()
        assert "sent_at" in result.data
        assert datetime.fromisoformat(result.data["sent_at"]).tzinfo is not None
        mock_generate_code.assert_not_called()

        request_payload = mock_http_client.post.call_args.kwargs["json"]
        assert request_payload["personalisation"]["verification_code"] == "CACHED12345"

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_blocks_when_ip_rate_limit_exceeded(
        self,
        mock_dispatch,
        mock_http_client,
        mock_request,
    ):
        """Should return 429 and skip downstream calls when IP limit is exceeded."""
        mock_request.app.state.redis_client.incr = AsyncMock(return_value=25)
        mock_request.app.state.redis_client.ttl = AsyncMock(return_value=30)

        with pytest.raises(HTTPException) as exc_info:
            await send_in_person_verification_code(
                mock_http_client,
                "mock-access-token",
                request=mock_request,
            )

        assert exc_info.value.status_code == 429
        assert exc_info.value.detail["reason"] == "ip_limit"
        assert exc_info.value.detail["retry_after_seconds"] == 30
        mock_dispatch.assert_not_called()
        mock_http_client.post.assert_not_called()

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_blocks_when_user_cooldown_is_active(
        self,
        mock_dispatch,
        mock_http_client,
        mock_profile,
        mock_request,
    ):
        """Should return 429 when user requests another code during cooldown."""
        mock_dispatch.return_value = mock_profile
        mock_request.app.state.redis_client.get = AsyncMock(return_value=None)
        mock_request.app.state.redis_client.ttl = AsyncMock(return_value=45)

        with pytest.raises(HTTPException) as exc_info:
            await send_in_person_verification_code(
                mock_http_client,
                "mock-access-token",
                request=mock_request,
            )

        assert exc_info.value.status_code == 429
        assert exc_info.value.detail["reason"] == "user_cooldown"
        assert exc_info.value.detail["retry_after_seconds"] == 45
        mock_http_client.post.assert_not_called()

    @pytest.mark.asyncio
    @patch.object(idv_module, "_gc_notify_config", MOCK_GC_NOTIFY_CONFIG)
    @patch.object(idv_module, "dispatch_get_my_profile_from_ibm")
    async def test_blocks_when_user_daily_limit_is_reached(
        self,
        mock_dispatch,
        mock_http_client,
        mock_profile,
        mock_request,
    ):
        """Should return 429 when user exceeds daily send allowance."""
        mock_dispatch.return_value = mock_profile
        mock_request.app.state.redis_client.get = AsyncMock(return_value="10")
        mock_request.app.state.redis_client.ttl = AsyncMock(return_value=3600)

        with pytest.raises(HTTPException) as exc_info:
            await send_in_person_verification_code(
                mock_http_client,
                "mock-access-token",
                request=mock_request,
            )

        assert exc_info.value.status_code == 429
        assert exc_info.value.detail["reason"] == "user_daily_limit"
        assert exc_info.value.detail["retry_after_seconds"] == 3600
        mock_http_client.post.assert_not_called()


class TestGetLastEmailSentTime:
    """Tests for get_last_email_sent_time function."""

    @pytest.mark.asyncio
    async def test_returns_datetime_when_email_sent_timestamp_exists(self):
        """Should return a datetime object when email sent timestamp is stored in Redis."""
        redis_client = AsyncMock()
        user_hash = "test-user-hash"
        sent_at = datetime.now(UTC)
        redis_client.get = AsyncMock(return_value=sent_at.isoformat())

        result = await idv_module.get_last_email_sent_time(redis_client, user_hash)

        assert result is not None
        assert isinstance(result, datetime)
        assert result.tzinfo is not None
        redis_client.get.assert_called_once_with(
            f"{idv_module.USER_EMAIL_SENT_KEY_PREFIX}:{user_hash}"
        )

    @pytest.mark.asyncio
    async def test_returns_none_when_no_email_sent_timestamp_exists(self):
        """Should return None when no email has been sent yet."""
        redis_client = AsyncMock()
        user_hash = "test-user-hash"
        redis_client.get = AsyncMock(return_value=None)

        result = await idv_module.get_last_email_sent_time(redis_client, user_hash)

        assert result is None
        redis_client.get.assert_called_once()

    @pytest.mark.asyncio
    async def test_returns_none_when_timestamp_is_invalid(self):
        """Should return None when stored timestamp is invalid."""
        redis_client = AsyncMock()
        user_hash = "test-user-hash"
        redis_client.get = AsyncMock(return_value="invalid-datetime-string")

        result = await idv_module.get_last_email_sent_time(redis_client, user_hash)

        assert result is None

    @pytest.mark.asyncio
    async def test_returns_correct_timestamp(self):
        """Should return the exact timestamp that was stored."""
        redis_client = AsyncMock()
        user_hash = "test-user-hash"
        sent_at = datetime(2026, 7, 13, 12, 30, 45, tzinfo=UTC)
        redis_client.get = AsyncMock(return_value=sent_at.isoformat())

        result = await idv_module.get_last_email_sent_time(redis_client, user_hash)

        assert result == sent_at

    @pytest.mark.asyncio
    async def test_returns_datetime_when_timestamp_is_bytes(self):
        """Should decode and parse byte timestamps returned by Redis."""
        redis_client = AsyncMock()
        user_hash = "test-user-hash"
        sent_at = datetime(2026, 7, 13, 12, 30, 45, tzinfo=UTC)
        redis_client.get = AsyncMock(return_value=sent_at.isoformat().encode("utf-8"))

        result = await idv_module.get_last_email_sent_time(redis_client, user_hash)

        assert result == sent_at

    @pytest.mark.asyncio
    async def test_timestamp_stored_after_successful_send(
        self,
    ):
        """Should store the email sent timestamp in Redis after successful send."""
        redis_client = AsyncMock()
        user_hash = _hash_user_identifier("user@example.com")
        sent_at = datetime.now(UTC)

        await idv_module._mark_successful_send(redis_client, user_hash, sent_at)

        # Verify setex was called for the email sent key
        calls = redis_client.setex.call_args_list
        email_sent_call = None
        for call in calls:
            if idv_module.USER_EMAIL_SENT_KEY_PREFIX in call[0][0]:
                email_sent_call = call
                break

        assert email_sent_call is not None
        assert (
            email_sent_call[0][0]
            == f"{idv_module.USER_EMAIL_SENT_KEY_PREFIX}:{user_hash}"
        )
        assert email_sent_call[0][1] == idv_module.USER_DAILY_WINDOW_SECONDS
        assert email_sent_call[0][2] == sent_at.isoformat()


def _hash_user_identifier(identifier: str) -> str:
    """Helper function to hash user identifier (email)."""
    import hashlib

    return hashlib.sha256(identifier.strip().lower().encode("utf-8")).hexdigest()


class TestGetInPersonLastEmailSentEndpoint:
    """Tests for GET /in-person/last-email-sent router endpoint."""

    @pytest.mark.asyncio
    async def test_returns_last_email_sent_date_from_redis(self):
        """Should return the last email sent timestamp from Redis."""
        from app.identity_verification.v1_router import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router, prefix="/v1/identity-verification")

        mock_request = MagicMock()
        mock_request.app.state.request_client = AsyncMock()

        redis_client = AsyncMock()
        last_sent = datetime.now(UTC)
        redis_client.get = AsyncMock(return_value=last_sent.isoformat())

        with (
            patch.object(idv_module, "get_redis_client", return_value=redis_client),
            patch.object(
                idv_module, "dispatch_get_my_profile_from_ibm"
            ) as mock_profile,
        ):
            mock_profile_instance = MagicMock()
            mock_profile_instance.userName = "user@example.com"
            mock_profile.return_value = mock_profile_instance

            # Call the endpoint handler directly
            from app.identity_verification.v1_router import (
                get_in_person_last_email_sent,
            )

            result = await get_in_person_last_email_sent(
                mock_request,
                "test-token",
            )

            assert result.success is True
            assert result.data["last_email_sent"] == last_sent.isoformat()

    @pytest.mark.asyncio
    async def test_returns_none_when_no_email_sent_yet(self):
        """Should return None when no email has been sent yet."""
        mock_request = MagicMock()
        mock_request.app.state.request_client = AsyncMock()

        redis_client = AsyncMock()
        redis_client.get = AsyncMock(return_value=None)

        with (
            patch.object(idv_module, "get_redis_client", return_value=redis_client),
            patch.object(
                idv_module, "dispatch_get_my_profile_from_ibm"
            ) as mock_profile,
        ):
            mock_profile_instance = MagicMock()
            mock_profile_instance.userName = "user@example.com"
            mock_profile.return_value = mock_profile_instance

            from app.identity_verification.v1_router import (
                get_in_person_last_email_sent,
            )

            result = await get_in_person_last_email_sent(
                mock_request,
                "test-token",
            )

            assert result.success is True
            assert result.data["last_email_sent"] is None

    @pytest.mark.asyncio
    async def test_returns_none_when_redis_unavailable(self):
        """Should return None for last_email_sent when Redis is unavailable."""
        mock_request = MagicMock()
        mock_request.app.state.request_client = AsyncMock()

        with patch.object(
            idv_module,
            "get_redis_client",
            side_effect=ValueError("Redis unavailable"),
        ):
            from app.identity_verification.v1_router import (
                get_in_person_last_email_sent,
            )

            result = await get_in_person_last_email_sent(
                mock_request,
                "test-token",
            )

            assert result.success is True
            assert result.data["last_email_sent"] is None
