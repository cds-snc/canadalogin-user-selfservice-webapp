import logging

from fastapi import HTTPException
from pydantic import ValidationError
from httpx import AsyncClient

from app.users.schemas import (
    IBMVerifyUserProfileSchema,
    ProfileResponse,
)
from app.utils.access_token import get_auth_request_headers
from app.utils.mask_phone_number import mask_contact_phone_numbers
from app.utils.mask_email_address import (
    mask_profile_email_addresses,
    mask_individual_email_address,
)
from app.utils.request_error_handler import RequestErrorHandler
from app.config import get_configuration

logger = logging.getLogger(__name__)


async def dispatch_get_my_profile_from_ibm(
    global_http_client: AsyncClient,
    user_access_token: str,
) -> IBMVerifyUserProfileSchema:
    """
    Fetch user profile data from IBM Verify API and return as Pydantic model.

    Args:
        request: FastAPI request object
        user_access_token: User's authentication token

    Returns:
        IBMVerifyUserProfileSchema: Validated user profile data from IBM Verify

    Raises:
        HTTPException: Via RequestErrorHandler for any request failures
    """
    try:
        logger.info("Get my profile")
        settings = get_configuration()
        profile_api_endpoint = settings.profile_api_endpoint
        logger.info("Fetching user profile from IBM Verify")
        response = await global_http_client.get(
            profile_api_endpoint,
            headers=get_auth_request_headers(user_access_token),
        )
        response.raise_for_status()
        logger.info("User profile fetched successfully from IBM Verify")

        json_data = response.json()

        return IBMVerifyUserProfileSchema(**json_data)
    except Exception as e:
        logger.error(f"Error fetching profile from IBM Verify: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)


async def get_my_profile(
    global_http_client: AsyncClient, user_access_token: str
) -> ProfileResponse:
    """
    Retrieve and return the authenticated user's profile with masked phone numbers.

    Args:
        request: FastAPI request object
        user_access_token: Authenticated User's access token

    Returns:
        ProfileResponse: User profile data with masked phone numbers

    Raises:
        HTTPException: For authentication, validation, or server errors
    """
    logger.info("Get my profile")

    profile_response = await dispatch_get_my_profile_from_ibm(
        global_http_client, user_access_token
    )
    logger.info("User profile retrieved successfully.")

    profile_data = profile_response.model_dump()
    profile_data["phoneNumbers"] = mask_contact_phone_numbers(profile_data)
    profile_data["emails"] = mask_profile_email_addresses(profile_data)
    profile_data["userName"] = mask_individual_email_address(
        profile_data.get("userName", "")
    )

    try:
        response_data = IBMVerifyUserProfileSchema(**profile_data)
    except ValidationError as e:
        logger.error(f"Profile Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")
    return ProfileResponse(
        success=True,
        message="User profile retrieved successfully.",
        data=response_data,
    )
