import logging

from httpx import AsyncClient
from pydantic import ValidationError

from app.config import get_settings
from app.otp.schemas import OtpVerification
from app.utils.access_token import get_access_token, get_auth_request_headers
from app.utils.helpers import generate_error_response
from app.utils.schemas import ResponseModel
from fastapi import HTTPException


class VerifyTransientVoiceOTP:
    def __init__(self):
        self.settings = get_settings().ibm_verify_config
        self.logger = logging.getLogger(__name__)
        
    async def handle_transient_voice_otp_verification(self, data: OtpVerification):
        response = None
        try:

            self.logger.info("Attempting to verify voice OTP")
            response = await self.dispatch__transient_voice_otp_verification(data)
            if response.status_code is None:
                return generate_error_response(400, "Unknown error")
            if response.status_code == 404 or response.status_code == 400:
                error_message = response.json().get('messageDescription', 'Unknown error')

                self.logger.info(
                    f"404 Error Attempting to verify voice OTP {error_message}")
                return generate_error_response(response.status_code, error_message)
            if response.status_code != 204:
                self.logger.error(
                    f"voice OTP Validation Request Error: {response.json()}")
                return generate_error_response(response.status_code, "Unknown error")

            return ResponseModel(
                success=True,
                message="Transient voice OTP has been validated")

        except Exception as e:
            raise HTTPException(status_code=response.status_code,
                                detail=str(response.reason))


    async def dispatch__transient_voice_otp_verification(self, data: OtpVerification):
        try:
            trxnId = data.trxnId
            pass_code = {
                "otp": data.otp,
            }
            access_token = await get_access_token()
            headers = get_auth_request_headers(access_token, True)
            settings = get_settings().ibm_verify_config
            transient_sms_verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/transient/verifications/{trxnId}"

            async with AsyncClient() as client:
                response = await client.post(transient_sms_verification_url, json=pass_code,
                                             headers=headers)
            return response

        except Exception as error:
            self.logger.error(
                f"request to voiceotp/transient/verifications error: {str(error)}", exc_info=True)
            return error