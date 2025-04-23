import logging
from datetime import datetime

from fastapi import Request, HTTPException
from httpx import AsyncClient
from pydantic import ValidationError

from app.config import get_settings
from app.otp.schemas import UserOtpInfo, OtpType, OtpSentResponse
from app.utils.access_token import get_access_token, get_auth_request_headers
from app.utils.helpers import generate_error_response
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def handle_otp_send(user_otp_info: UserOtpInfo, otp_type: OtpType, global_http_client: AsyncClient):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        logger.info(f"Attempting to send {otp_type} OTP")
        start_time = datetime.now()
        http_client_response = await dispatch_otp(user_otp_info, otp_type, global_http_client)
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"{otp_type} OTP send request response received in {duration:.2f} seconds")

        if http_client_response.status_code is None:
            return generate_error_response(400, "Unknown error")

        if http_client_response.status_code != 201:
            logger.error(f"Error while sending {otp_type} OTP: {http_client_response.json()}")
            return generate_error_response(http_client_response.status_code, "Unknown error")

        response_json = http_client_response.json()

        if http_client_response.status_code == 201:
            logger.info(f"{otp_type} OTP created and sent")

            try:
                validated_data = OtpSentResponse(**response_json)

            except ValidationError as e:
                logger.error(f"Validation Error: {e.json()}")
                return generate_error_response(422, "Server Error")

            return ResponseModel(
                success=True,
                data=validated_data,
                message=f"{otp_type} OTP sent successfully")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Send transient {otp_type} error: {str(e)}")


async def dispatch_otp(user_otp_info: UserOtpInfo, otp_type: OtpType, global_http_client: AsyncClient):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    if otp_type == OtpType.VOICE or otp_type == OtpType.SMS:
        user_phone_number = {
            "phoneNumber": ''.join(c for c in user_otp_info.phoneNumber if c.isdigit()) # Verify's transient sms and voice endpoints do not accept non-numbers in the input string
        }
    else:
        user_email_address = {
            "emailAddress": user_otp_info.emailAddress
        }

    try:
        access_token = await get_access_token()
        headers = get_auth_request_headers(access_token, True)
        settings = get_settings().ibm_verify_config

        if otp_type == OtpType.SMS:
            send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/transient/verifications"
            response = await global_http_client.post(send_transient_otp_url, json=user_phone_number, headers=headers)
            return response

        elif otp_type == OtpType.VOICE:
            send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/transient/verifications"
            response = await global_http_client.post(send_transient_otp_url, json=user_phone_number, headers=headers)
            return response

        elif otp_type == OtpType.EMAIL:
            send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications"
            response = await global_http_client.post(send_transient_otp_url, json=user_email_address, headers=headers)
            return response

        else:
            generate_error_response(400, 'Unknown error')

    except Exception as error:
        logger.error(
            f"Request to smsotp/transient/verifications error: {str(error)}", exc_info=True)
        return error