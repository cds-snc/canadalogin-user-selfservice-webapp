import logging

from httpx import AsyncClient

from app.config import get_settings
from app.otp.schemas import OtpVerification
from app.users.schemas import TwoFactorEnrollmentUserData
from app.users.services.two_factor_enrollment import handle_enrolling_user_into_2fa
from app.utils.access_token import get_access_token, get_auth_request_headers
from app.utils.helpers import generate_error_response
from app.utils.schemas import ResponseModel
from fastapi import HTTPException, Request

http_client: AsyncClient
logger = logging.getLogger(__name__)


async def handle_otp_verification(data: OtpVerification, global_http_client: AsyncClient):
    global http_client
    http_client = global_http_client
    otp_verification_response = None

    try:
        logger.info(f"Attempting to verify {data.otp_type} OTP")
        otp_verification_response = await verify_otp(data)

        if otp_verification_response.status_code is None:
            return generate_error_response(400, "Unknown error")

        if otp_verification_response.status_code != 204:
            logger.error(f"verify {data.otp_type} request Error: {otp_verification_response.body}")
            return generate_error_response(otp_verification_response.status_code, "Unknown error")

        if otp_verification_response.status_code == 204 and data.flow == 'transient' and data.otp_type != 'email':
            enrollment_data = TwoFactorEnrollmentUserData(userId=data.userId, phoneNumber=data.phoneNumber, otp_type=data.otp_type)
            await handle_enrolling_user_into_2fa(enrollment_data, data.otp_type, http_client)

        return ResponseModel(
            success=True,
            message=f"{data.otp_type} OTP has been verified")


    except HTTPException as he:
        logger.error(f"HTTP Exception in signup: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Signup error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400, detail=f"Signup error: {str(e)}")


async def verify_otp(data: OtpVerification):
    try:
        otp = {
            "otp": data.otp,
        }

        access_token = await get_access_token()
        headers = get_auth_request_headers(access_token, True)
        settings = get_settings().ibm_verify_config

        verification_endpoint_url = ""
        if data.otp_type == "sms":
            verification_endpoint_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/transient/verifications/{data.trxnId}"
        elif data.otp_type == "voice":
            verification_endpoint_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/transient/verifications/{data.trxnId}"
        elif data.otp_type == "email":
            verification_endpoint_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications/{data.trxnId}"
        else:
            return generate_error_response(400, "Unknown error")

        response = await http_client.post(verification_endpoint_url, json=otp, headers=headers)
        return response

    except HTTPException as he:
        logger.error(f"HTTP Exception in {data.otp_type} 2FA enrollment: {str(he)}")
        raise he
    except Exception as e:
        logger.error(
            f"{data.otp_type} 2FA enrollment error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400, detail=f"{data.otp_type} 2FA enrollment error: {str(e)}")