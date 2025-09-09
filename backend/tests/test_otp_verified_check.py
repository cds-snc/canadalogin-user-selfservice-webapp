# tests/test_verify_transient_otp.py

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import Response, Request
from fastapi.responses import JSONResponse

from app.otp.services.verify_transient_otp import (
    handle_otp_verification,
    verify_otp,
)
from app.otp.schemas import UserOtpVerificationInfo, OtpType
import json


# --------------- handle_otp_verification tests ------------------


@pytest.mark.asyncio
@patch("app.otp.services.verify_transient_otp.verify_otp")
async def test_handle_otp_verification_success(mock_verify_otp):
    user_data = UserOtpVerificationInfo(
        otp="123456", trxnId="txn123", otpType=OtpType.SMS
    )
    # Simulate a successful response
    mock_verify_otp.return_value = Response(
        status_code=204, request=Request("POST", "https://example.com")
    )

    result = await handle_otp_verification(user_data, AsyncMock())

    # ✅ No need for json.loads or .body
    assert result.success is True
    assert "OTP has been verified" in result.message


@pytest.mark.asyncio
@patch("app.otp.services.verify_transient_otp.verify_otp")
async def test_handle_otp_verification_failure(mock_verify_otp):
    user_data = UserOtpVerificationInfo(
        otp="654321", trxnId="txn456", otpType=OtpType.EMAIL
    )
    mock_resp = MagicMock()
    mock_resp.status_code = 400
    mock_resp.json.return_value = {"error": "Invalid OTP"}

    mock_verify_otp.return_value = mock_resp

    result: JSONResponse = await handle_otp_verification(
        user_data,
        AsyncMock(),
    )

    body = json.loads(result.body)
    assert result.status_code == 400
    assert body["success"] is False
    assert "Unknown error" in body["message"]


# --------------- verify_otp tests ------------------


@pytest.mark.asyncio
@patch("app.otp.services.verify_transient_otp.get_auth_request_headers")
@patch("app.otp.services.verify_transient_otp.get_configuration")
async def test_verify_otp_sms_success(mock_get_config, mock_get_headers):
    user_data = UserOtpVerificationInfo(
        otp="111111", trxnId="txn_sms", otpType=OtpType.SMS
    )
    mock_headers = {"Authorization": "Bearer token"}
    mock_get_headers.return_value = mock_headers

    class Settings:
        IBM_VERIFY_TENANT_URL = "https://ibm"

    cfg = MagicMock()
    cfg.ibm_verify_config = Settings()
    mock_get_config.return_value = cfg

    mock_client = AsyncMock()
    expected_url = f"{Settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/transient/verifications/{user_data.trxnId}"
    resp = Response(status_code=204, request=Request("POST", expected_url))
    mock_client.post.return_value = resp

    result = await verify_otp(
        user_data,
        mock_client,
    )

    assert result.status_code == 204
    mock_client.post.assert_awaited_once_with(
        expected_url, json={"otp": user_data.otp}, headers=mock_headers
    )


@pytest.mark.asyncio
@patch("app.otp.services.verify_transient_otp.get_auth_request_headers")
@patch("app.otp.services.verify_transient_otp.get_configuration")
async def test_verify_otp_email_success(mock_get_config, mock_get_headers):
    user_data = UserOtpVerificationInfo(
        otp="222222", trxnId="txn_email", otpType=OtpType.EMAIL
    )
    mock_headers = {"Authorization": "Bearer token"}
    mock_get_headers.return_value = mock_headers

    class Settings:
        IBM_VERIFY_TENANT_URL = "https://ibm"

    cfg = MagicMock()
    cfg.ibm_verify_config = Settings()
    mock_get_config.return_value = cfg

    mock_client = AsyncMock()
    expected_url = f"{Settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications/{user_data.trxnId}"
    resp = Response(status_code=204, request=Request("POST", expected_url))
    mock_client.post.return_value = resp

    result = await verify_otp(
        user_data,
        mock_client,
    )

    assert result.status_code == 204
    mock_client.post.assert_awaited_once()


@pytest.mark.asyncio
@patch("app.otp.services.verify_transient_otp.get_auth_request_headers")
@patch("app.otp.services.verify_transient_otp.get_configuration")
async def test_verify_otp_invalid_type_returns_error(mock_get_config, mock_get_headers):
    user_data = UserOtpVerificationInfo(
        otp="333333", trxnId="txn_invalid", otpType=OtpType.SMS
    )
    # Simulate invalid type
    user_data.otpType = "INVALID"

    result = await verify_otp(user_data, AsyncMock())

    # ✅ Fix: Load response body if it's a JSONResponse
    body = json.loads(result.body)

    assert isinstance(body, dict)
    assert body["success"] is False
    assert "Unknown error" in body["message"]
