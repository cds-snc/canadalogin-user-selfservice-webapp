from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

import pytest
from httpx import AsyncClient, Request, Response

from app.password.schemas import FirstStepPasswordUpdatePayload, OtpType
from app.password.services.first_step_update_password import (
    dispatch_password_otp,
    first_step_update_password,
)


@pytest.mark.asyncio
async def test_first_step_update_password_preserves_email_enrollment_id():
    mock_http_client = AsyncMock(spec=AsyncClient)
    payload = FirstStepPasswordUpdatePayload(
        otpType=OtpType.EMAILOTP,
        enrollmentId="email-enrollment-123",
    )

    mock_profile = SimpleNamespace(
        userName="user@example.com",
        preferredLanguage="en",
    )

    mock_response = Mock()
    mock_response.json.return_value = {
        "trxId": "trx-123",
        "stepsRemaining": 2,
        "nextStep": {
            "method": "emailotp",
            "httpMethod": "POST",
            "uri": "/v1/password/update/validate",
            "expiryTime": "2026-06-08T19:00:00Z",
        },
    }

    with (
        patch(
            "app.password.services.first_step_update_password.dispatch_get_my_profile_from_ibm",
            new_callable=AsyncMock,
        ) as mock_get_profile,
        patch(
            "app.password.services.first_step_update_password.dispatch_password_otp",
            new_callable=AsyncMock,
        ) as mock_dispatch_password_otp,
    ):
        mock_get_profile.return_value = mock_profile
        mock_dispatch_password_otp.return_value = mock_response

        result = await first_step_update_password(
            mock_http_client,
            payload,
            "user-token",
        )

        assert payload.enrollmentId == "email-enrollment-123"
        called_payload = mock_dispatch_password_otp.await_args.args[1]
        assert called_payload.enrollmentId == "email-enrollment-123"
        assert called_payload.userName == "user@example.com"
        assert result.success is True
        assert result.data.trxId == "trx-123"


@pytest.mark.asyncio
async def test_dispatch_password_otp_uses_provided_enrollment_id_for_emailotp():
    mock_http_client = AsyncMock(spec=AsyncClient)
    payload = FirstStepPasswordUpdatePayload(
        userName="user@example.com",
        otpType=OtpType.EMAILOTP,
        enrollmentId="email-enrollment-456",
    )

    mock_settings = Mock()
    mock_settings.password_resetter_api_endpoint = "https://verify.example.com/reset"

    request = Request("POST", "https://verify.example.com/reset")
    response = Response(
        200,
        json={"trxId": "trx-123", "stepsRemaining": 1},
        request=request,
    )
    mock_http_client.post.return_value = response

    with (
        patch(
            "app.password.services.first_step_update_password.get_admin_token",
            new_callable=AsyncMock,
        ) as mock_get_admin_token,
        patch(
            "app.password.services.first_step_update_password.get_auth_request_headers"
        ) as mock_get_headers,
        patch(
            "app.password.services.first_step_update_password.get_configuration",
            return_value=mock_settings,
        ),
    ):
        mock_get_admin_token.return_value = "admin-token"
        mock_get_headers.return_value = {"Authorization": "Bearer admin-token"}

        await dispatch_password_otp(mock_http_client, payload, "en")

    _, kwargs = mock_http_client.post.call_args
    assert kwargs["json"]["steps"][0]["method"] == "emailotp"
    assert kwargs["json"]["steps"][0]["data"]["enrollmentId"] == "email-enrollment-456"
