import logging

from httpx import AsyncClient
from pydantic import ValidationError
from pydantic_settings import BaseSettings
from app.otp.schemas import PhoneNumber, ViaPhoneOtpResponse
from app.utils.access_token import get_access_token, get_auth_request_headers
from app.utils.helpers import generate_error_response
from app.utils.schemas import ResponseModel
from fastapi import HTTPException

class SendTransientVoiceOTP:
    def __init__(self, settings: BaseSettings, http_client: AsyncClient):
        self.logger = logging.getLogger(__name__)
        self.settings = settings
        self.http_client = http_client

    async def handle_transient_voice_otp(self, user_phone_number: PhoneNumber):
        response = None

        try:
            self.logger.info("Attempting to send Voice OTP")
            response = await self.dispatch_voice_otp(user_phone_number.phoneNumber)
            if response.status_code is None:
                return generate_error_response(400, "Unknown error")
            if response.status_code != 201:
                self.logger.error(f"Send Voice Request Error: {response.json()}")
                return generate_error_response(response.status_code, "Unknown error")

            response_json = response.json()

            if response.status_code == 201:
                self.logger.info("Voice OTP created and sent")

                try:
                    validated_data = ViaPhoneOtpResponse(**response_json)

                except ValidationError as e:
                    self.logger.error(f"Validation Error: {e.json()}")
                    return generate_error_response(422, "Server Error")

                return ResponseModel(
                    success=True,
                    data=validated_data,
                    message="Voice OTP sent successfully")

        except Exception as e:
            raise HTTPException(status_code=response.status_code,
                                    detail=str(response.reason))

    async def dispatch_voice_otp(self, user_phone_number: int):
        user_phone_number = {
            "phoneNumber": user_phone_number
        }

        try:
            access_token = await get_access_token()
            headers = get_auth_request_headers(access_token, True)
            transient_voice_verification_url = f"{self.settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/transient/verifications"
            response = await self.http_client.post(transient_voice_verification_url, json=user_phone_number, headers=headers)
            return response

        except Exception as error:
            self.logger.error(
                f"request to voiceotp/transient/verifications error: {str(error)}", exc_info=True)
            return error