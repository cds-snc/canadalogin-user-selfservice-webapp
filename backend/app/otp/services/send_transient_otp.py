import logging
from datetime import datetime

from fastapi import Request, HTTPException
from pydantic import ValidationError

from app.config import get_settings
from app.otp.schemas import UserOtpInfo, OtpType, OtpSentResponse
from app.utils.access_token import get_access_token, get_auth_request_headers
from app.utils.helpers import generate_error_response
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)
settings = get_settings().ibm_verify_config

end_user_otp_info = None
end_user_otp_type = None
http_client = None
http_client_response = None

async def handle_otp_send(user_otp_info: UserOtpInfo, otp_type: OtpType, request: Request ):
    global end_user_otp_info
    global end_user_otp_type
    global http_client
    global http_client_response

    end_user_otp_info = user_otp_info
    end_user_otp_type = otp_type
    http_client = request

    try:
        logger.info(f"Attempting to send {end_user_otp_type.value} OTP")
        start_time = datetime.now()
        http_client_response = await dispatch_otp()
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"{end_user_otp_type.value} OTP send request response received in {duration:.2f} seconds")

        if http_client_response.status_code is None:
            return generate_error_response(400, "Unknown error")

        if http_client_response.status_code != 201:
            logger.error(f"Error while sending {end_user_otp_type.value} OTP: {http_client_response.json()}")
            return generate_error_response(http_client_response.status_code, "Unknown error")

        response_json = http_client_response.json()

        if http_client_response.status_code == 201:
            logger.info(f"{end_user_otp_type.value} OTP created and sent")

            try:
                validated_data = OtpSentResponse(**response_json)

            except ValidationError as e:
                logger.error(f"Validation Error: {e.json()}")
                return generate_error_response(422, "Server Error")

            return ResponseModel(
                success=True,
                data=validated_data,
                message=f"{end_user_otp_type.value} OTP sent successfully")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Send transient {end_user_otp_type.value} error: {str(e)}")


async def dispatch_otp():

    if end_user_otp_type == OtpType.VOICE or end_user_otp_type == OtpType.SMS:

        user_phone_number = {
            "phoneNumber": ''.join(c for c in end_user_otp_info.phoneNumber if c.isdigit()) # Verify's transient sms and voice OTPs do not accept non-numbers in the input string
        }

    else:
        user_email_address = {
            "emailAddress": end_user_otp_info.emailAddress
        }

    try:
        access_token = await get_access_token()
        headers = get_auth_request_headers(access_token, True)

        if end_user_otp_type == OtpType.SMS:
            send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/transient/verifications"
            response = await http_client.post(send_transient_otp_url, json=user_phone_number, headers=headers)
            return response

        if end_user_otp_type == OtpType.VOICE:
            send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/transient/verifications"
            response = await http_client.post(send_transient_otp_url, json=user_phone_number, headers=headers)
            return response

        if end_user_otp_type == OtpType.EMAIL:
            send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications"
            response = await http_client.post(send_transient_otp_url, json=user_email_address, headers=headers)
            return response

    except Exception as error:
        logger.error(
            f"Request to smsotp/transient/verifications error: {str(error)}", exc_info=True)
        return error