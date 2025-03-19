import logging
from fastapi import HTTPException
from httpx import AsyncClient

from app.config import get_settings
from app.utils.helpers import generate_error_response
from app.otp.schemas import EmailOtpVerification
from app.utils.access_token import get_access_token, get_auth_request_headers
from app.utils.schemas import ResponseModel


logger = logging.getLogger(__name__)


async def ibm_verify_email_opt(data: EmailOtpVerification):
    try:

        trxnId = data.trxnId
        pass_code = {
            "otp": data.otp
        }

        access_token = await get_access_token()
        headers = get_auth_request_headers(access_token, True)
        settings = get_settings().ibm_verify_config
        transient_email_verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications/{trxnId}"

        async with AsyncClient() as client:
            response = await client.post(transient_email_verification_url, json=pass_code, headers=headers)
            logger.info("Request returned")
            return response

    except Exception as error:
        logger.error(
            f"request to emailotp/transient/verifications/ error: {str(error)}", exc_info=True)
        return error


async def verify_email_otp(data: EmailOtpVerification):

    try:

        logger.info("Attempting to verify email OTP")
        response = await ibm_verify_email_opt(data)
        if response.status_code is None:
            return generate_error_response(400, "Unknown error")
        if response.status_code == 404 or response.status_code == 400:
            error_message = response.json().get('messageDescription', 'Unknown error')

            logger.info(
                f"404 Error Attempting to verify email OTP {error_message}")
            return generate_error_response(response.status_code, error_message)
        if response.status_code != 204:
            logger.error(
                f"Email OTP Validation Request Error: {response.json()}")
            return generate_error_response(response.status_code, "Unknown error")

        return ResponseModel(
            success=True,
            message="Email OTP has been validated")

        # return successful_response

    except Exception as e:
        raise HTTPException(status_code=response.status_code,
                            detail=str(response.reason))
