import logging
from datetime import datetime

from fastapi import HTTPException, status
from httpx import AsyncClient

from app.config import get_configuration
from app.otp.schemas import OtpType, UserOtpVerificationInfo
from app.utils.access_token import get_auth_request_headers
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def handle_otp_verification(
    global_http_client: AsyncClient,
    user_verification_data: UserOtpVerificationInfo,
    user_access_token: str,
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""
    logger.info(f"Attempting to verify {user_verification_data.otpType} OTP")
    start_time = datetime.now()
    otp_verification_response = await verify_otp(
        global_http_client, user_verification_data, user_access_token
    )
    duration = (datetime.now() - start_time).total_seconds()
    logger.info(
        f"{user_verification_data.otpType} OTP verification response received in {duration:.2f} seconds"
    )

    if (
        otp_verification_response.status_code is None
        or otp_verification_response.status_code != 204
    ):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error enrolling {user_verification_data.otpType} OTP: {otp_verification_response.json() if hasattr(otp_verification_response, 'json') else None}",
        )

    return ResponseModel(  # Plain ResponseModel since the response has no content
        success=True,
        message=f"{user_verification_data.otpType.value} OTP has been verified",
    )


async def verify_otp(
    global_http_client: AsyncClient,
    user_verification_data: UserOtpVerificationInfo,
    user_access_token: str,
):
    trxnId = user_verification_data.trxnId
    otp = {
        "otp": user_verification_data.otp,
    }

    headers = get_auth_request_headers(user_access_token, True)
    settings = get_configuration().ibm_verify_config

    if user_verification_data.otpType == OtpType.SMS:
        verification_endpoint_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/transient/verifications/{trxnId}"

    elif user_verification_data.otpType == OtpType.VOICE:
        verification_endpoint_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/transient/verifications/{trxnId}"

    elif user_verification_data.otpType == OtpType.EMAIL:
        verification_endpoint_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications/{trxnId}"

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid User OTP Type",
        )
    response = await global_http_client.post(
        verification_endpoint_url, json=otp, headers=headers
    )
    response.raise_for_status()
    logger.info("verify_otp returned successfully")
    return response
