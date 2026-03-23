from app.config import get_configuration
from fastapi import HTTPException, status
from app.otp.schemas import (
    OtpType,
    OtpVerificationCreateRequest,
    VerificationCreateResponseData,
)
from app.users.services.get_my_profile import get_my_profile
from app.utils.access_token import get_auth_request_headers
from app.utils.helpers import generate_error_response
from app.utils.schemas import ResponseModel


from httpx import AsyncClient, HTTPStatusError

import logging

logger = logging.getLogger(__name__)


async def dispatch_send_mfa_otp(
    global_http_client: AsyncClient,
    verification_request: OtpVerificationCreateRequest,
    otp_type: OtpType,
    user_access_token: str,
    language: str = None,
):
    """Dispatch Send MFA OTP verification to IBM Verify"""
    headers = get_auth_request_headers(user_access_token, True, language)
    settings = get_configuration().ibm_verify_config

    if otp_type == OtpType.SMS:
        verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/{verification_request.id}/verifications"
    elif otp_type == OtpType.VOICE:
        verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/{verification_request.id}/verifications"
    else:
        raise ValueError(f"Unsupported OTP type: {otp_type}")

    response = await global_http_client.post(verification_url, json={}, headers=headers)
    response.raise_for_status()
    return response


async def handle_send_mfa_otp(
    global_http_client: AsyncClient,
    verification_request: OtpVerificationCreateRequest,
    user_access_token: str,
    otp_type: OtpType,
):
    """Send an MFA OTP for SMS or Voice"""
    
    # Verify user profile
    my_profile_response = await get_my_profile(
        global_http_client, user_access_token
    )
    if not my_profile_response.success:
        otp_type_str = (
            otp_type.value if hasattr(otp_type, "value") else str(otp_type)
        )
        logger.error(
            f"Failed to get user profile for {otp_type_str} verification creation"
        )
        return ResponseModel(
            success=False, data=None, message="User verification failed"
        )

    # Get user's preferred language from profile
    user_language = my_profile_response.data.preferredLanguage or "en"
    logger.info(f"Using user's preferred language: {user_language}")

    http_client_response = await dispatch_send_mfa_otp(
        global_http_client,
        verification_request,
        otp_type,
        user_access_token,
        user_language,
    )

    response_json = http_client_response.json()
    logger.info(f"IBM Verify MFA OTP response: {response_json}")

    # Parse the verification response
    verification_data = VerificationCreateResponseData(**response_json)

    return ResponseModel(
        success=True,
        data=verification_data,
        message=f"{otp_type.value} MFA OTP verification created successfully",
    )