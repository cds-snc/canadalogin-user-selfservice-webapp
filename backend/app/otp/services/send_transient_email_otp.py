import logging
from fastapi import HTTPException
from pydantic import ValidationError
from httpx import AsyncClient
from pydantic_settings import BaseSettings
from app.config import get_settings
from app.utils.helpers import generate_error_response
from app.otp.schemas import EmailOtpResponse, UserName
from app.utils.access_token import get_access_token, get_auth_request_headers
from app.utils.schemas import ResponseModel

class SendTransientEmailOTP:
    def __init__(self, settings: BaseSettings, http_client: AsyncClient):
        self.logger = logging.getLogger(__name__)
        self.settings = settings
        self.http_client = http_client

    async def handle_transient_email_otp(self, user_email_address: UserName):

        try:

            self.logger.info("Attempting to send email OTP")
            response = await self.dispatch_email_otp(user_email_address.userName)
            if response.status_code is None:
                return generate_error_response(400, "Unknown error")
            if response.status_code != 201:
                self.logger.error(f"Send Email Request Error: {response.json()}")
                return generate_error_response(response.status_code, "Unknown error")

            response_json = response.json()

            if response.status_code == 201:
                self.logger.info("Email OTP created and sent")

                try:
                    validated_data = EmailOtpResponse(**response_json)

                except ValidationError as e:
                    self.logger.error(f"Validation Error: {e.json()}")
                    return generate_error_response(422, "Server Error")

                return ResponseModel(
                    success=True,
                    data=validated_data,
                    message="OTP sent successfully")

        except Exception as e:
            raise HTTPException(status_code=response.status_code,
                                detail=str(response.reason))


    async def dispatch_email_otp(self, user_email_address: str):
        try:
            user_email_address = {
                "emailAddress": user_email_address
            }
            access_token = await get_access_token()
            headers = get_auth_request_headers(access_token, True)
            settings = get_settings().ibm_verify_config
            transient_email_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications"
            response = await self.http_client.post(transient_email_otp_url, json=user_email_address, headers=headers)
            self.logger.info("Request returned")
            return response

        except Exception as error:
            self.logger.error(
                f"request to emailotp/transient/verifications error: {str(error)}", exc_info=True)
            return error



