import logging

from fastapi import HTTPException, Request
from httpx import Response
from pydantic import ValidationError

from app.users.schemas import (
    IBMVerifyUserProfileSchema,
    ProfileResponse,
    MetaDataTypeValue,
)
from app.utils.access_token import get_auth_request_headers
from app.utils.mask_phone_number import mask_phone_number
from app.utils.request_error_handler import RequestErrorHandler

logger = logging.getLogger(__name__)


def mask_contact_phone_numbers(
    json_data: dict,
) -> list[MetaDataTypeValue]:
    """
    Mask phone numbers in user profile data, showing only the last 4 digits.

    Args:
        json_data: User profile JSON data containing phoneNumbers

    Returns:
        list[MetaDataTypeValue] | None: List of phone number objects with masked values
    """

    profile_contact_phone_numbers = json_data.get("phoneNumbers")

    if profile_contact_phone_numbers is None:
        return None

    masked_phone_numbers = []
    for phone in profile_contact_phone_numbers:
        value = phone.get("value")
        if not value:
            continue
        masked_phone = phone.copy()  # Create a copy of the original phone dict
        masked_phone["value"] = mask_phone_number(value)
        masked_phone_numbers.append(masked_phone)
    return masked_phone_numbers


async def dispatch_get_my_profile_from_ibm(
    request: Request,
    user_access_token: str,
) -> Response:
    """
    Fetch user profile data from IBM Verify API.

    Args:
        request: FastAPI request object
        user_access_token: User's authentication token

    Returns:
        Response: Raw HTTP response from IBM Verify

    Raises:
        HTTPException: Via RequestErrorHandler for any request failures
    """
    try:
        logger.info("dispatch_get_my_profile")
        headers = get_auth_request_headers(user_access_token)
        response = await request.app.state.request_client.get(
            request.app.state.config.profile_api_endpoint,
            headers=headers,
        )
        response.raise_for_status()
        logger.info("user profile from IBM returned successfully")
        return response

    except Exception as e:
        logger.error(f"Error dispatching get_my_profile: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)


async def get_my_profile(request: Request, user_access_token: str):
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

    response = await dispatch_get_my_profile_from_ibm(request, user_access_token)
    logger.info("User profile retrieved successfully.")
    try:
        json_data = response.json()
    except Exception as e:
        logger.error(f"Failed to parse profile response: {str(e)}")
        raise HTTPException(status_code=422, detail="Request data validation error")

    json_data["phoneNumbers"] = mask_contact_phone_numbers(json_data)

    try:
        response_data = IBMVerifyUserProfileSchema(**json_data)
    except ValidationError as e:
        logger.error(f"Profile Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")
    return ProfileResponse(
        success=True,
        message="User profile retrieved successfully.",
        data=response_data,
    )
