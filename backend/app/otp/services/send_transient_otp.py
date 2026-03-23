import logging
from datetime import datetime

from app.config import get_configuration
from app.otp.schemas import OtpDataResponse, OtpType, UserOtpInfo
from app.users.services.otp_factors import get_user_otp_factor
from app.users.services.get_my_profile import get_my_profile
from app.utils.access_token import get_auth_request_headers
from app.utils.helpers import (
    prepare_pydantic_phone_number_for_verify,
)
from app.utils.schemas import ResponseModel
from fastapi import HTTPException, status
from httpx import AsyncClient, HTTPStatusError

logger = logging.getLogger(__name__)


async def handle_otp_send(
    global_http_client: AsyncClient,
    user_otp_info: UserOtpInfo,
    user_access_token: str,
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    logger.info(f"Attempting to send {user_otp_info.otpType} OTP")
    start_time = datetime.now()
    my_profile_response = await get_my_profile(global_http_client, user_access_token)
    # Get user's preferred language from profile
    user_language = my_profile_response.data.preferredLanguage or "en"
    logger.info(f"Using user's preferred language: {user_language}")

    if user_otp_info.factor_id is not None:
        user_otp_factor = await get_user_otp_factor(
            global_http_client, user_access_token, user_otp_info.factor_id
        )

        user_otp_info.destination = user_otp_factor.get("destination")

    http_client_response = await dispatch_otp(
        global_http_client, user_otp_info, user_access_token, user_language
    )
    duration = (datetime.now() - start_time).total_seconds()
    logger.info(
        f"{user_otp_info.otpType} OTP send request response received in {duration:.2f} seconds"
    )

    if http_client_response.status_code is None:
        logger.error("HTTP response status code is None")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unknown error",
        )

    if http_client_response.status_code != 201:
        logger.error(
            f"Error while sending {user_otp_info.otpType} OTP: {http_client_response.json()}"
        )
        # Use RequestErrorHandler to handle the error response consistently
        # Create an HTTPStatusError to pass to the handler
        raise HTTPStatusError(
            message=f"HTTP {http_client_response.status_code}",
            request=http_client_response.request,
            response=http_client_response,
        )

    response_json = http_client_response.json()

    if http_client_response.status_code == 201:
        logger.info(f"{user_otp_info.otpType} OTP created and sent")

        validated_data = OtpDataResponse(**response_json)

        return ResponseModel(
            success=True,
            data=validated_data,
            message=f"{user_otp_info.otpType.value} OTP sent successfully",
        )


async def dispatch_otp(
    global_http_client: AsyncClient,
    user_otp_info: UserOtpInfo,
    user_access_token: str,
    language: str = None,
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    headers = get_auth_request_headers(user_access_token, True, language)
    settings = get_configuration().ibm_verify_config

    if user_otp_info.otpType == OtpType.SMS or user_otp_info.otpType == OtpType.VOICE:
        user_phone_number = {
            "phoneNumber": prepare_pydantic_phone_number_for_verify(
                user_otp_info.destination
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

    elif user_otp_info.otpType == OtpType.EMAIL:
        # Use emailAddress if provided, otherwise fall back to userName
        target_email = user_otp_info.destination
        user_email_address = {
            "emailAddress": target_email.lower()
        }  # Ensure consistent email formatting
        send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications"
        response = await global_http_client.post(
            send_transient_otp_url, json=user_email_address, headers=headers
        )
        return response

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error dispatching {user_otp_info.otpType} OTP",
        )
