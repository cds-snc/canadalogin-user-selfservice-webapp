import logging
from datetime import datetime

from app.config import get_configuration
from app.otp.schemas import OtpDataResponse, OtpType, UserOtpInfo
from app.users.services.otp_factors import get_user_otp_factors_unmasked
from app.users.services.get_my_profile import get_my_profile
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.helpers import (
    extract_last_4_digits,
    generate_error_response,
    is_masked_phone_number,
    prepare_pydantic_phone_number_for_verify,
)
from app.utils.schemas import ResponseModel
from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError

logger = logging.getLogger(__name__)


async def resolve_masked_phone_number(
    global_http_client: AsyncClient,
    user_profile_id: str,
    masked_phone: str,
    otp_type: OtpType,
) -> str:
    """
    Resolve a masked phone number to the actual phone number by matching last 4 digits.

    Args:
        global_http_client: HTTP client for API calls
        user_profile_id: User's profile ID
        masked_phone: Masked phone number (e.g., "***-***-1234")
        otp_type: OTP type enum (OtpType.SMS or OtpType.VOICE)

    Returns:
        The resolved actual phone number
    """
    try:
        # Get unmasked user OTP factors
        user_factors = await get_user_otp_factors_unmasked(
            global_http_client, user_profile_id
        )

        # Extract last 4 digits from masked phone
        masked_last_4 = extract_last_4_digits(masked_phone)

        # Find matching factor by last 4 digits and type
        for factor in user_factors:
            factor_phone = factor.get("phoneNumber", "")
            factor_type = factor.get("type", "")

            # Extract last 4 digits from the actual phone number
            actual_last_4 = "".join(filter(str.isdigit, factor_phone))[-4:]

            # Match by last 4 digits and compatible type
            type_match = False
            if otp_type == OtpType.SMS and factor_type.lower() in ["smsotp", "sms"]:
                type_match = True
            elif otp_type == OtpType.VOICE and factor_type.lower() in [
                "voiceotp",
                "voice",
            ]:
                type_match = True

            if actual_last_4 == masked_last_4 and type_match:
                logger.info(f"Resolved masked phone number. Last 4: {masked_last_4}")
                # Ensure phone number has proper format for PhoneNumber validation
                # Add + prefix if it's missing (needed for international format)
                if factor_phone.isdigit():
                    if len(factor_phone) == 11 and factor_phone.startswith("1"):
                        # 11-digit number starting with 1 (North American with country code)
                        factor_phone = f"+{factor_phone}"
                    elif len(factor_phone) == 10:
                        # 10-digit number (North American without country code)
                        factor_phone = f"+1{factor_phone}"
                return factor_phone

        # If no match found, raise an error
        logger.error(f"Could not resolve masked phone number ending in {masked_last_4}")
        raise HTTPException(
            status_code=400,
            detail=f"No matching phone factor found for number ending in {masked_last_4}",
        )

    except Exception as e:
        logger.error(f"Error resolving masked phone number: {str(e)}")
        raise


async def handle_otp_send(
    global_http_client: AsyncClient, user_otp_info: UserOtpInfo, user_access_token: str
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        logger.info(f"Attempting to send {user_otp_info.otpType} OTP")
        start_time = datetime.now()
        my_profile_response = await get_my_profile(global_http_client, user_access_token)
        if my_profile_response.data.userName != user_otp_info.userName:
            logger.error("User mismatch - cannot send OTP")
            return generate_error_response(403, "User mismatch - cannot send OTP")
        logger.info("User verified to send OTP")

        # Handle masked phone numbers
        resolved_user_otp_info = user_otp_info
        if user_otp_info.phoneNumber and is_masked_phone_number(
            user_otp_info.phoneNumber
        ):
            logger.info("Detected masked phone number, resolving to actual number")
            try:
                actual_phone = await resolve_masked_phone_number(
                    global_http_client,
                    my_profile_response.data.id,
                    user_otp_info.phoneNumber,
                    user_otp_info.otpType,
                )

                # Create a new UserOtpInfo with the resolved phone number
                # The field validator will automatically format it using PhoneNumber
                resolved_user_otp_info = UserOtpInfo(
                    phoneNumber=actual_phone,
                    userName=user_otp_info.userName,
                    otpType=user_otp_info.otpType,
                )
                logger.info("Successfully resolved masked phone number")
            except Exception as e:
                logger.error(f"Failed to resolve masked phone number: {str(e)}")
                return generate_error_response(400, str(e))

        http_client_response = await dispatch_otp(
            global_http_client, resolved_user_otp_info
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
                message=f"{user_otp_info.otpType.value} OTP sent successfully",
            )

    except Exception as e:
        logger.error(f"Send transient {user_otp_info.otpType} error: {str(e)}")
        return ResponseModel(
            success=False,
            data=None,
            message=f"Send transient {user_otp_info.otpType} error: {str(e)}",
        )


async def dispatch_otp(global_http_client: AsyncClient, user_otp_info: UserOtpInfo):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        access_token = await get_admin_token(
            global_http_client
        )  # Pass global_http_client here
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
            user_email_address = {
                "emailAddress": user_otp_info.userName.lower()
            }  # Ensure consistent email formatting
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
