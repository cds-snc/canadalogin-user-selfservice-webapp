import logging
import phonenumbers
from datetime import datetime

from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError

from app.config import get_configuration
from app.users.schemas import (
    UserAuthFactorsIbmResponse,
    UserAuthFactorsResponse,
    UserOTPFactors
)
from app.password.schemas import (
    OtpType
)
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.users.services.profile import my_profile

from app.utils.request_error_handler import RequestErrorHandler

logger = logging.getLogger(__name__)


async def mask_phone_last4(phone: str, region: str = "US") -> str:
    """
    Parse and format a phone number with phonenumbers,
    but mask all except the last 4 digits.
    """
    try:
        # Parse the phone number
        parsed = phonenumbers.parse(phone, region)

        # Format ((123) 456-7890) - also removes the country code
        formatted_to_string = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.NATIONAL)

        # Extract phone number string only
        digits = ''.join(filter(str.isdigit, formatted_to_string))

        # Mask everything except the last 4
        last4 = digits[-4:]
        masked = f"*** *** {last4}"

        return masked
    except Exception as e:
        return f"Invalid phone number: {str(e)}"


async def parse_auth_factors_response(data: UserAuthFactorsIbmResponse) -> UserOTPFactors:
    logger.info("parse_auth_factors_response")
    factors = data.factors
    if not factors:
        logger.warning("No OTP factors found for user")
        raise HTTPException(status_code=404, detail="No OTP factors found for user")

    first_factor = factors[0]
    if not first_factor:
        logger.warning("No OTP factors found for user")
        raise HTTPException(status_code=404, detail="No OTP factors found for user")

    phone_number = getattr(first_factor.attributes, "phoneNumber", None)
    if not phone_number:
        logger.warning("No OTP factors found for user")
        raise HTTPException(status_code=404, detail="No OTP factors found for user")

    return {
        "type": first_factor.type,
        "phoneNumber": phone_number
    }


async def dispatch_user_auth_factors(
    global_http_client: AsyncClient,
    user_profile_id: str,
    otp_type: OtpType,
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_configuration()

        user_otp_factors_api_endpoint = settings.user_otp_factors_api_endpoint

        search_params = {
            "enabled": True,
            "validated": True,
            "search": f'userId="{user_profile_id}"&type="{otp_type.value}"'
        }

        otp_factor_response = await global_http_client.get(
            user_otp_factors_api_endpoint, params=search_params, headers=headers
        )

        otp_factor_response.raise_for_status()
        logger.info("user_otp_factors_api_endpoint returned successfully")
        return otp_factor_response.json()

    except Exception as e:
        logger.error(f"Error dispatch_password_reset_otp: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)


async def get_user_otp_factors(
    global_http_client: AsyncClient,
    user_id: str,
    otp_type: OtpType,
    user_access_token: str,
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        user_profile = await my_profile(global_http_client, user_access_token)
        logger.info(f"get_user_otp_factors for: {user_id}")

        if user_profile.success:
            user_profile_id = user_profile.data.id
            logger.info(f"user_id: {user_id} ")
            logger.info(f"user_profile_id: {user_profile_id} ")
            if user_profile_id == user_id:
                logger.info(f"user_otp_factors: {user_id}")
                start_time = datetime.now()
                user_otp_factors_response = await dispatch_user_auth_factors(global_http_client, user_profile_id, otp_type)
                duration = (datetime.now() - start_time).total_seconds()
                logger.info(f"user_otp_factors returned in {duration:.2f} seconds")

                try:
                    validated_data = UserAuthFactorsIbmResponse(**user_otp_factors_response)
                except ValidationError as validation_error:
                    logger.warning("Invalid API response schema: %s", validation_error.errors())
                    raise HTTPException(status_code=422, detail="Invalid response")

                phone_number_otp_factor = await parse_auth_factors_response(validated_data)
                masked_phone_number = await mask_phone_last4(phone_number_otp_factor["phoneNumber"])
                data = {
                    "type": phone_number_otp_factor["type"],
                    "phoneNumber": masked_phone_number
                }
                logger.info("success response and data validation for user auth factors")
                return UserAuthFactorsResponse(
                    success=True,
                    message="User factor retrieved successfully.",
                    data=data
                )
            else:
                logger.info("user_id and user profile id dont math ")
                raise HTTPException(status_code=404, detail="No OTP factors found for user")
        else:
            raise HTTPException(status_code=404, detail="No OTP factors found for user")

    except Exception as e:
        logger.error(f"Error getting user auth factors: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)
