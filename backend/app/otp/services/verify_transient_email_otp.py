import logging
from fastapi import HTTPException
from httpx import AsyncClient
from pydantic_settings import BaseSettings
from app.utils.helpers import generate_error_response
from app.otp.schemas import OtpVerification
from app.utils.access_token import get_access_token, get_auth_request_headers
from app.utils.schemas import ResponseModel



class VerifyTransientEmailOTP:
    def __init__(self, settings: BaseSettings, http_client: AsyncClient):
        self.logger = logging.getLogger(__name__)
        self.settings = settings
        self.http_client = http_client

    async def handle_transient_email_otp_verification(self, data: OtpVerification):
        response = None
        try:

            self.logger.info("Attempting to verify email OTP")
            response = await self.dispatch_email_otp(data)
            if response.status_code is None:
                return generate_error_response(400, "Unknown error")
            if response.status_code == 404 or response.status_code == 400:
                error_message = response.json().get('messageDescription', 'Unknown error')

                self.logger.info(
                    f"404 Error Attempting to verify email OTP {error_message}")
                return generate_error_response(response.status_code, error_message)
            if response.status_code != 204:
                self.logger.error(
                    f"Email OTP Validation Request Error: {response.json()}")
                return generate_error_response(response.status_code, "Unknown error")

            return ResponseModel(
                success=True,
                message="Email OTP has been validated")

        except Exception as e:
            raise HTTPException(status_code=response.status_code,
                                detail=str(response.reason))


    async def dispatch_email_otp(self, data: OtpVerification):
        try:

            trxnId = data.trxnId
            pass_code = {
                "otp": data.otp
            }

            access_token = await get_access_token()
            headers = get_auth_request_headers(access_token, True)
            transient_email_verification_url = f"{self.settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications/{trxnId}"
            response = await self.http_client.post(transient_email_verification_url, json=pass_code, headers=headers)
            self.logger.info("HTTP Request: returned successfully")
            return response

        except Exception as error:
            self.logger.error(
                f"request to emailotp/transient/verifications/ error: {str(error)}", exc_info=True)
            return error



