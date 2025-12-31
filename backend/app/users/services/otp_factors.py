import logging
from datetime import datetime
from typing import Optional

from app.config import get_configuration
from app.password.schemas import OtpType
from app.users.schemas import (
    UserAuthFactorsIbmResponse,
    UserPhoneAuthFactorsResponse,
    UserPhoneOTPFactors,
)
from app.users.services.get_my_profile import get_my_profile
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.mask_user_profile import mask_phone_number
from app.utils.request_error_handler import RequestErrorHandler
from fastapi import HTTPException, status
from httpx import AsyncClient
from pydantic import ValidationError

logger = logging.getLogger(__name__)


async def parse_phone_auth_factors_response(
    data: UserAuthFactorsIbmResponse,
) -> UserPhoneOTPFactors:
    logger.info("parse_auth_factors_response")
    factors = data.factors
    if not factors:
        logger.warning("No OTP factors found for user")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No OTP factors found for user",
        )
    first_factor = factors[0]
    if not first_factor:
        logger.warning("No OTP factors found for user")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No OTP factors found for user",
        )

    phone_factors = []
    ALLOWED_TYPES = {OtpType.SMSOTP.value, OtpType.VOICEOTP.value}

    for factor in factors:
        if factor.type in ALLOWED_TYPES:
            phone_number = getattr(factor.attributes, "phoneNumber", None)
            if not phone_number:
                logger.warning("Factor %s has no phoneNumber", factor.id)
                continue
            masked_phonenumber = mask_phone_number(phone_number)
            phone_factors.append(
                {
                    "id": factor.id,
                    "type": factor.type,
                    "phoneNumber": masked_phonenumber,
                }
            )

    if not phone_factors:
        logger.warning("No OTP factors found for user")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No OTP factors found for user",
        )

    return phone_factors


async def parse_phone_auth_factors_response_unmasked(
    data: UserAuthFactorsIbmResponse,
) -> UserPhoneOTPFactors:
    """Parse phone auth factors response without masking phone numbers."""
    logger.info("parse_auth_factors_response_unmasked")
    factors = data.factors
    if not factors:
        logger.warning("No OTP factors found for user")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No OTP factors found for user",
        )
    first_factor = factors[0]
    if not first_factor:
        logger.warning("No OTP factors found for user")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No OTP factors found for user",
        )

    phone_factors = []
    ALLOWED_TYPES = {OtpType.SMSOTP.value, OtpType.VOICEOTP.value}

    for factor in factors:
        if factor.type in ALLOWED_TYPES:
            phone_number = getattr(factor.attributes, "phoneNumber", None)
            if not phone_number:
                logger.warning("Factor %s has no phoneNumber", factor.id)
                continue
            phone_factors.append(
                {
                    "id": factor.id,
                    "type": factor.type,
                    "phoneNumber": phone_number,  # Unmasked phone number
                }
            )

    if not phone_factors:
        logger.warning("No OTP factors found for user")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No OTP factors found for user",
        )

    return phone_factors


async def dispatch_user_auth_factors(
    global_http_client: AsyncClient,
    user_profile_id: str,
    validated: Optional[bool] = True,
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_configuration()

        user_otp_factors_api_endpoint = settings.user_otp_factors_api_endpoint

        # Combine all search parameters into a single 'search' parameter, URL-encoded following the specs of IBM Verify docs
        # https://docs.verify.ibm.com/verify/reference/listfactorenrollments_20
        if validated is None:
            # Get all factors regardless of validation status
            search_value = f'userId="{user_profile_id}"&enabled=true'
        else:
            validated_str = "true" if validated else "false"
            search_value = (
                f'userId="{user_profile_id}"&enabled=true&validated={validated_str}'
            )
        search_params = {"search": search_value}
        logger.info(
            f"get user auth factors, userid: {user_profile_id}, validated: {validated}"
        )

        otp_factor_response = await global_http_client.get(
            user_otp_factors_api_endpoint, params=search_params, headers=headers
        )

        otp_factor_response.raise_for_status()
        logger.info("user_otp_factors_api_endpoint returned successfully")
        return otp_factor_response.json()

    except Exception as e:
        logger.error(f"Error dispatch_password_reset_otp: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)


async def get_user_otp_factors_unmasked(
    global_http_client: AsyncClient,
    user_profile_id: str,
    validated: bool = True,
):
    """
    Get user OTP factors with unmasked phone numbers for internal use.
    The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls.
    """
    try:
        logger.info(
            f"get_user_otp_factors_unmasked for profile_id: {user_profile_id}, validated: {validated}"
        )

        start_time = datetime.now()
        user_otp_factors_response = await dispatch_user_auth_factors(
            global_http_client, user_profile_id, validated
        )
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"user_otp_factors returned in {duration:.2f} seconds")

        try:
            validated_data = UserAuthFactorsIbmResponse(**user_otp_factors_response)
        except ValidationError as validation_error:
            logger.warning("Invalid API response schema: %s", validation_error.errors())
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid response",
            )

        phone_number_otp_factors = await parse_phone_auth_factors_response_unmasked(
            validated_data
        )
        logger.info(
            "success response and data validation for user auth factors (unmasked)"
        )
        return phone_number_otp_factors

    except Exception as e:
        logger.error(
            f"Error getting user auth factors (unmasked): {str(e)}", exc_info=True
        )
        RequestErrorHandler.handle(e)


async def get_user_otp_factors(
    global_http_client: AsyncClient,
    user_id: str,
    user_access_token: str,
    validated: Optional[bool] = True,
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        user_profile = await get_my_profile(global_http_client, user_access_token)
        logger.info(f"get_user_otp_factors for: {user_id}, validated: {validated}")

        if user_profile.success:
            user_profile_id = user_profile.data.id
            logger.info(f"user_id: {user_id} ")
            logger.info(f"user_profile_id: {user_profile_id} ")
            if user_profile_id == user_id:
                logger.info(f"user_otp_factors: {user_id}")
                start_time = datetime.now()
                user_otp_factors_response = await dispatch_user_auth_factors(
                    global_http_client, user_profile_id, validated
                )
                duration = (datetime.now() - start_time).total_seconds()
                logger.info(f"user_otp_factors returned in {duration:.2f} seconds")

                try:
                    validated_data = UserAuthFactorsIbmResponse(
                        **user_otp_factors_response
                    )
                except ValidationError as validation_error:
                    logger.warning(
                        "Invalid API response schema: %s", validation_error.errors()
                    )
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="Invalid response",
                    )

                phone_number_otp_factor = await parse_phone_auth_factors_response(
                    validated_data
                )
                logger.info(
                    "success response and data validation for user auth factors"
                )
                return UserPhoneAuthFactorsResponse(
                    success=True,
                    message="User factor retrieved successfully.",
                    data=phone_number_otp_factor,
                )
            else:
                logger.info(
                    f"user_id and user profile id dont match. user_profile_id = {user_profile_id}. user_profile.data.id = {user_profile.data.id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No OTP factors found for user",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No OTP factors found for user",
            )

    except Exception as e:
        logger.error(f"Error getting user auth factors: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)
