import logging

from httpx import AsyncClient
from pydantic import ValidationError

from app.config import get_settings
from app.otp.schemas import PhoneNumber, ViaPhoneOtpResponse
from app.utils.access_token import get_access_token, get_auth_request_headers
from app.utils.helpers import generate_error_response
from app.utils.schemas import ResponseModel
from fastapi import HTTPException


class SendTransientSMSOTP:
    def __init__(self):
        self.settings = get_settings().ibm_verify_config
        self.logger = logging.getLogger(__name__)


    async def handle_transient_sms_otp(self, user_phone_number: PhoneNumber):
        response = None

        try:
            self.logger.info("Attempting to send SMS OTP")
            response = await self.dispatch_sms_otp(user_phone_number.phoneNumber)
            if response.status_code is None:
                return generate_error_response(400, "Unknown error")
            if response.status_code != 201:
                self.logger.error(f"Send SMS Request Error: {response.json()}")
                return generate_error_response(response.status_code, "Unknown error")

            response_json = response.json()

            if response.status_code == 201:
                self.logger.info("SMS OTP created and sent")

                try:
                    validated_data = ViaPhoneOtpResponse(**response_json)

                except ValidationError as e:
                    self.logger.error(f"Validation Error: {e.json()}")
                    return generate_error_response(422, "Server Error")

                return ResponseModel(
                    success=True,
                    data=validated_data,
                    message="SMS OTP sent successfully")

        except Exception as e:
            raise HTTPException(status_code=response.status_code,
                                    detail=str(response.reason))


    async def dispatch_sms_otp(self,user_phone_number: int):
        user_phone_number = {
            "phoneNumber": user_phone_number
        }

        try:
            access_token = await get_access_token()
            headers = get_auth_request_headers(access_token, True)
            settings = get_settings().ibm_verify_config
            transient_sms_verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/transient/verifications"

            async with AsyncClient() as client:
                response = await client.post(transient_sms_verification_url, json=user_phone_number, headers=headers)
            return response

        except Exception as error:
            self.logger.error(
                f"request to smsotp/transient/verifications error: {str(error)}", exc_info=True)
            return error


