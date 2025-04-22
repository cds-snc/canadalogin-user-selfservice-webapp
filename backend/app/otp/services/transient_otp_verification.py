import logging
from datetime import datetime

from fastapi import HTTPException
from httpx import AsyncClient

from app.config import get_settings
from app.otp.schemas import OtpType, UserOtpVerificationInfo
from app.utils.access_token import get_access_token, get_auth_request_headers
from app.utils.helpers import generate_error_response
from app.utils.schemas import ResponseModel

http_client = None
logger = logging.getLogger(__name__)
verification_data = None
end_user_otp_type = None

async def handle_otp_verification(user_verification_data: UserOtpVerificationInfo, otp_type: OtpType, global_http_client: AsyncClient):
    global http_client
    global verification_data
    global end_user_otp_type
    http_client = global_http_client
    verification_data = user_verification_data
    end_user_otp_type = otp_type

    # otp_verification_response = None

    try:
        logger.info(f"Attempting to verify {otp_type.value} OTP")
        start_time = datetime.now()
        otp_verification_response = await verify_otp()
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"{end_user_otp_type.value} OTP verification response received in {duration:.2f} seconds")

        if otp_verification_response.status_code is None:
            return generate_error_response(400, "Unknown error")

        if otp_verification_response.status_code != 204:
            logger.error(f"Failed to verify {otp_type} 2FA. Response: {otp_verification_response.json()}")
            return generate_error_response(otp_verification_response.status_code, "Unknown error")

        return ResponseModel(# Plain ResponseModel since the response has no content
            success=True,
            message=f"{end_user_otp_type.value} OTP has been verified")


    except HTTPException as he:
        logger.error(f"HTTP Exception in {end_user_otp_type.value} OTP verification: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"{end_user_otp_type.value} verification error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400, detail=f"{end_user_otp_type.value} verification error: {str(e)}")


async def verify_otp():
    try:

        trxnId = verification_data.trxnId
        otp = {
            "otp": verification_data.otp,
        }

        access_token = await get_access_token()
        headers = get_auth_request_headers(access_token, True)
        settings = get_settings().ibm_verify_config

        verification_endpoint_url = ""
        if end_user_otp_type.value == OtpType.SMS:
            verification_endpoint_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/transient/verifications/{trxnId}"

        elif end_user_otp_type.value == OtpType.VOICE:
            verification_endpoint_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/transient/verifications/{trxnId}"

        elif end_user_otp_type.value == OtpType.EMAIL:
            verification_endpoint_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications/{trxnId}"

        else:
            return generate_error_response(400, "Unknown error")

        response = await http_client.post(verification_endpoint_url, json=otp, headers=headers)
        return response

    except HTTPException as he:
        logger.error(f"HTTP Exception in {end_user_otp_type.value} verification: {str(he)}")
        raise he
    except Exception as e:
        logger.error(
            f"{end_user_otp_type.value} verification error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400, detail=f"{end_user_otp_type.value} verification error: {str(e)}")