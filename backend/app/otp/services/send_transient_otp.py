import logging
from datetime import datetime

from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError

from app.config import get_configuration
from app.otp.schemas import UserOtpInfo, OtpType, OtpDataResponse
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.helpers import (
    generate_error_response,
    prepare_pydantic_phone_number_for_verify,
    format_error_response,
)
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def handle_otp_send(
    user_otp_info: UserOtpInfo, global_http_client: AsyncClient
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        logger.info(f"Attempting to send {user_otp_info.otpType} OTP")
        start_time = datetime.now()
        http_client_response = await dispatch_otp(
            user_otp_info, global_http_client
        )
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"{user_otp_info.otpType} OTP send request response received in {duration:.2f} seconds"
        )

        if http_client_response.status_code is None:
            return ResponseModel(
                success=False,
                data=None,
                message="Unknown error",
            )

        if http_client_response.status_code != 201:
            logger.error(
                f"Error while sending {user_otp_info.otpType} OTP: {http_client_response.json()}"
            )
            error_message = http_client_response.json().get("error", "Unknown error")
            return ResponseModel(
                success=False,
                data=None,
                message=error_message,
            )

        response_json = http_client_response.json()

        if http_client_response.status_code == 201:
            logger.info(f"{user_otp_info.otpType} OTP created and sent")

            try:
                validated_data = OtpDataResponse(**response_json)

            except ValidationError as e:
                logger.error(f"Validation Error: {e.json()}")
                return ResponseModel(
                    success=False,
                    data=None,
                    message="Server Error",
                )

            return ResponseModel(
                success=True,
                data=validated_data,
                message=f"{user_otp_info.otpType} OTP sent successfully",
            )

    except Exception as e:
        logger.error(f"Send transient {user_otp_info.otpType} error: {str(e)}")
        return ResponseModel(
            success=False,
            data=None,
            message=f"Send transient {user_otp_info.otpType} error: {str(e)}",
        )


async def dispatch_otp(
    user_otp_info: UserOtpInfo, global_http_client: AsyncClient
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        access_token = await get_admin_token(global_http_client)  # Pass global_http_client here
        headers = get_auth_request_headers(access_token, True)
        settings = get_configuration().ibm_verify_config

        if user_otp_info.phoneNumber:
            user_phone_number = {
                "phoneNumber": prepare_pydantic_phone_number_for_verify(
                    user_otp_info.phoneNumber
                )  # Ensure consistent formatting of phone numbers
            }

        if user_otp_info.otpType == OtpType.SMS:
            send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/transient/verifications"
            response = await global_http_client.post(
                send_transient_otp_url, json=user_phone_number, headers=headers
            )
            return response

        elif user_otp_info.otpType == OtpType.VOICE:
            send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/transient/verifications"
            response = await global_http_client.post(
                send_transient_otp_url, json=user_phone_number, headers=headers
            )
            return response

        elif user_otp_info.userName and user_otp_info.otpType == OtpType.EMAIL:
            user_email_address = {"emailAddress": user_otp_info.userName.lower()}  # Ensure consistent email formatting
            send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications"
            response = await global_http_client.post(
                send_transient_otp_url, json=user_email_address, headers=headers
            )
            return response

        else:
            generate_error_response(400, "Unknown error")

    except HTTPException as he:
        logger.error(f"HTTP Exception in {user_otp_info.otpType} send: {str(he)}")
        raise he
    except Exception as error:
        logger.error(
            f"Request to: /v2.0/factors/{user_otp_info.otpType}otp/transient/verifications error: {str(error)}",
            exc_info=True,
        )
        raise error  # Raise the error to ensure proper exception handling
