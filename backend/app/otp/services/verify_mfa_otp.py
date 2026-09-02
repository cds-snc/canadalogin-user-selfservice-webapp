import logging

from app.config import get_configuration
from app.otp.schemas import (
    OtpType,
    OtpVerificationAttemptRequest,
)
from app.users.services.get_my_profile import get_my_profile
from app.utils.access_token import get_auth_request_headers
from app.utils.schemas import ResponseModel
from fastapi import HTTPException, status
from httpx import AsyncClient

logger = logging.getLogger(__name__)


async def _fetch_mfa_otp_status_snapshot(
    global_http_client: AsyncClient,
    attempt_request: OtpVerificationAttemptRequest,
    otp_type: OtpType,
    user_access_token: str,
):
    """Best-effort fetch of MFA OTP status metadata from IBM Verify."""
    headers = get_auth_request_headers(user_access_token, True)
    settings = get_configuration().ibm_verify_config

    if otp_type == OtpType.SMS:
        status_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/{attempt_request.id}/verifications/{attempt_request.trxnId}"
    elif otp_type == OtpType.VOICE:
        status_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/{attempt_request.id}/verifications/{attempt_request.trxnId}"
    elif otp_type == OtpType.EMAIL:
        status_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/{attempt_request.id}/verifications/{attempt_request.trxnId}"
    else:
        return {
            "attempts": None,
            "retries": None,
            "created": None,
            "expiry": None,
        }

    snapshot = {
        "attempts": None,
        "retries": None,
        "created": None,
        "expiry": None,
    }

    try:
        status_response = await global_http_client.get(status_url, headers=headers)
        if status_response.status_code != 200:
            return snapshot
        body = status_response.json()
        snapshot["attempts"] = body.get("attempts")
        snapshot["retries"] = body.get("retries")
        snapshot["created"] = body.get("created")
        snapshot["expiry"] = body.get("expiry")
        return snapshot
    except Exception as exc:  # noqa: BLE001 - best effort enrichment
        logger.warning(f"Failed to retrieve MFA OTP status snapshot: {exc}")
        return snapshot


async def handle_verify_mfa_otp(
    global_http_client: AsyncClient,
    attempt_request: OtpVerificationAttemptRequest,
    user_access_token: str,
    otp_type: OtpType,
):
    """Verify MFA OTP for SMS, Voice, or Email."""
    # Verify user profile
    my_profile_response = await get_my_profile(global_http_client, user_access_token)
    if not my_profile_response.success:
        logger.error(f"Failed to get user profile for {otp_type} verification attempt")
        return ResponseModel(
            success=False, data=None, message="User verification failed"
        )

    await dispatch_verify_mfa_otp(
        global_http_client, attempt_request, otp_type, user_access_token
    )

    # IBM Verify API returns 204 No Content on successful verification attempt
    return ResponseModel(
        success=True,
        data=None,
        message=f"{otp_type.value} MFA OTP verification completed successfully",
    )


async def dispatch_verify_mfa_otp(
    global_http_client: AsyncClient,
    attempt_request: OtpVerificationAttemptRequest,
    otp_type: OtpType,
    user_access_token: str,
):
    """Dispatch MFA OTP verification attempt to IBM Verify."""
    headers = get_auth_request_headers(user_access_token, True)
    settings = get_configuration().ibm_verify_config

    attempt_data = {"otp": attempt_request.otp}

    if otp_type == OtpType.SMS:
        verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/{attempt_request.id}/verifications/{attempt_request.trxnId}"
    elif otp_type == OtpType.VOICE:
        verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/{attempt_request.id}/verifications/{attempt_request.trxnId}"
    elif otp_type == OtpType.EMAIL:
        verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/{attempt_request.id}/verifications/{attempt_request.trxnId}"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OTP type: {otp_type}",
        )

    response = await global_http_client.post(
        verification_url, json=attempt_data, headers=headers
    )

    if response.status_code == 204:
        return response

    try:
        error_body = response.json()
    except Exception:
        error_body = {}

    message_id = error_body.get("messageId", "UNKNOWN")
    status_snapshot = {
        "attempts": None,
        "retries": None,
        "created": None,
        "expiry": None,
    }

    if response.status_code == 400:
        status_snapshot = await _fetch_mfa_otp_status_snapshot(
            global_http_client,
            attempt_request,
            otp_type,
            user_access_token,
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={
            "message": message_id,
            "attempts": status_snapshot.get("attempts"),
            "retries": status_snapshot.get("retries"),
            "created": status_snapshot.get("created"),
            "expiry": status_snapshot.get("expiry"),
            "trxnId": attempt_request.trxnId,
        },
    )
