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
from app.utils.access_token import get_auth_request_headers
from app.utils.string_masking import mask_phone_number
from httpx import AsyncClient

logger = logging.getLogger(__name__)


async def parse_phone_auth_factors_response(
    data: UserAuthFactorsIbmResponse, masked: bool = True
) -> UserPhoneOTPFactors:
    logger.info("parse_auth_factors_response")

    factors = data.factors

    if not factors or not factors[0]:
        return []

    phone_factors = []
    ALLOWED_TYPES = {OtpType.SMSOTP.value, OtpType.VOICEOTP.value}

    for factor in factors:
        if factor.type in ALLOWED_TYPES:
            phone_number = getattr(factor.attributes, "phoneNumber", None)
            if not phone_number:
                logger.warning("Factor %s has no phoneNumber", factor.id)
                continue
            if masked:
                phone_number = mask_phone_number(phone_number)
            phone_factors.append(
                {
                    "id": factor.id,
                    "type": factor.type,
                    "destination": phone_number,
                }
            )

    return phone_factors


async def dispatch_user_auth_factors(
    global_http_client: AsyncClient,
    user_access_token: str,
    validated: Optional[bool] = True,
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    headers = get_auth_request_headers(user_access_token, True)
    settings = get_configuration()

    user_otp_factors_api_endpoint = settings.user_otp_factors_api_endpoint

    # Combine all search parameters into a single 'search' parameter, URL-encoded following the specs of IBM Verify docs
    # https://docs.verify.ibm.com/verify/reference/listfactorenrollments_20
    # With user access token the results are automatically scoped to the authenticated user
    if validated is None:
        # Get all factors regardless of validation status
        search_value = "enabled=true"
    else:
        validated_str = "true" if validated else "false"
        search_value = f"enabled=true&validated={validated_str}"
    search_params = {"search": search_value}
    logger.info(f"get user auth factors, validated: {validated}")

    otp_factor_response = await global_http_client.get(
        user_otp_factors_api_endpoint, params=search_params, headers=headers
    )

    otp_factor_response.raise_for_status()
    logger.info("user_otp_factors_api_endpoint returned successfully")
    return otp_factor_response.json()


async def get_user_otp_factor(
    global_http_client: AsyncClient,
    user_access_token: str,
    factor_id: str,
    validated: bool = True,
):
    """
    Get user OTP factor with unmasked phone numbers for internal use.
    The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls.
    """
    logger.info(
        f"get_user_otp_factor for factor_id: {factor_id}, validated: {validated}"
    )

    start_time = datetime.now()
    user_otp_factors_response = await dispatch_user_auth_factors(
        global_http_client, user_access_token, validated
    )
    duration = (datetime.now() - start_time).total_seconds()
    logger.info(f"user_otp_factors returned in {duration:.2f} seconds")

    validated_data = UserAuthFactorsIbmResponse(**user_otp_factors_response)

    # current only support phone OTP
    phone_number_otp_factors = await parse_phone_auth_factors_response(
        validated_data, False
    )

    phone_number_otp_factor = next(
        (
            factor
            for factor in phone_number_otp_factors
            if factor.get("id") == factor_id
        ),
        None,
    )

    logger.info("success response and data validation for user auth factors (unmasked)")

    return phone_number_otp_factor


async def get_user_otp_factors(
    global_http_client: AsyncClient,
    user_access_token: str,
    validated: Optional[bool] = True,
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    logger.info("get_user_otp_factors")
    start_time = datetime.now()
    user_otp_factors_response = await dispatch_user_auth_factors(
        global_http_client, user_access_token, validated
    )
    duration = (datetime.now() - start_time).total_seconds()
    logger.info(f"user_otp_factors returned in {duration:.2f} seconds")

    validated_data = UserAuthFactorsIbmResponse(**user_otp_factors_response)

    phone_number_otp_factor = await parse_phone_auth_factors_response(validated_data)
    logger.info("success response and data validation for user auth factors")
    return UserPhoneAuthFactorsResponse(
        success=True,
        message="User factor retrieved successfully.",
        data=phone_number_otp_factor,
    )
