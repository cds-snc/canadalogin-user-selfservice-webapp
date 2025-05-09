import logging
from datetime import datetime

from fastapi import HTTPException
from httpx import AsyncClient

from app.config import get_settings
from app.otp.schemas import OtpType, UserOtpVerificationInfo
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.helpers import generate_error_response
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def handle_otp_verification(
    user_verification_data: UserOtpVerificationInfo, global_http_client: AsyncClient
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""
    try:
        logger.info(f"Attempting to verify {user_verification_data.otpType} OTP")
        start_time = datetime.now()
        otp_verification_response = await verify_otp(
            user_verification_data, global_http_client
        )
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"{user_verification_data.otpType} OTP verification response received in {duration:.2f} seconds"
        )

        if otp_verification_response.status_code is None:
            return generate_error_response(400, "Unknown error")

        if otp_verification_response.status_code != 204:
            logger.error(
                f"Failed to verify {user_verification_data.otpType} OTP. Response: {otp_verification_response.json()}"
            )
            return generate_error_response(
                otp_verification_response.status_code, otp_verification_response.json()
            )

        return ResponseModel(  # Plain ResponseModel since the response has no content
            success=True,
            message=f"{user_verification_data.otpType} OTP has been verified",
        )

    except HTTPException as he:
        logger.error(
            f"HTTP Exception in {user_verification_data.otpType} OTP verification: {str(he)}"
        )
        raise he
    except Exception as e:
        logger.error(
            f"{user_verification_data.otpType} verification error: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=400,
            detail=f"{user_verification_data.otpType} verification error: {str(e)}",
        )


async def verify_otp(
    user_verification_data: UserOtpVerificationInfo, global_http_client: AsyncClient
):
    try:

        trxnId = user_verification_data.trxnId
        otp = {
            "otp": user_verification_data.otp,
        }

        access_token = await get_admin_token()
        headers = get_auth_request_headers(access_token, True)
        settings = get_settings().ibm_verify_config

        if user_verification_data.otpType == OtpType.SMS:
            verification_endpoint_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/transient/verifications/{trxnId}"

        elif user_verification_data.otpType == OtpType.VOICE:
            verification_endpoint_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/transient/verifications/{trxnId}"

        elif user_verification_data.otpType == OtpType.EMAIL:
            verification_endpoint_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications/{trxnId}"

        else:
            return generate_error_response(400, "Unknown error")

        response = await global_http_client.post(
            verification_endpoint_url, json=otp, headers=headers
        )
        return response

    except HTTPException as he:
        logger.error(
            f"HTTP Exception in {user_verification_data.otpType} verification: {str(he)}"
        )
        raise he
    except Exception as e:
        logger.error(
            f"{user_verification_data.otpType} verification error: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=400,
            detail=f"{user_verification_data.otpType} verification error: {str(e)}",
        )
