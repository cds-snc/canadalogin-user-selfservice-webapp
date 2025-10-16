import logging

from fastapi import HTTPException, Request
from httpx import Response
from pydantic import ValidationError

from app.users.schemas import (
    IBMVerifyUserProfileSchema,
    ProfileResponse,
    UserProfileUpdateRequest,
    IBMVerifyUpdateUserProfile,
)
from app.utils.access_token import get_auth_request_headers
from app.utils.mask_phone_number import mask_contact_phone_numbers
from app.utils.request_error_handler import RequestErrorHandler
from app.users.services.get_my_profile import dispatch_get_my_profile_from_ibm

logger = logging.getLogger(__name__)


def sanitize_user_profile_data(user_data: UserProfileUpdateRequest) -> dict:
    # validation and then turns it into a UserProfileUpdateRequest dict
    """
    Validate and sanitize user profile update data.

    Args:
        user_data: User profile update request

    Returns:
        dict: Sanitized data with unset and None values excluded
    """
    updated_data_dict = user_data.model_dump(exclude_unset=True, exclude_none=True)
    return updated_data_dict


async def dispatch_update_user_profile(
    request: Request,
    user_profile_payload: str,
    user_access_token: str,
) -> Response:
    """
    Send user profile update to IBM Verify API.

    Args:
        request: FastAPI request object
        user_profile_payload: JSON string of profile data
        user_access_token: User's authentication token

    Returns:
        Response: Raw HTTP response from IBM Verify

    Raises:
        HTTPException: Via RequestErrorHandler for any request failures
    """
    try:
        logger.info("dispatch_update_user_profile")
        headers = get_auth_request_headers(user_access_token)
        response = await request.app.state.request_client.put(
            request.app.state.config.profile_api_endpoint,
            content=user_profile_payload,
            headers=headers,
        )
        response.raise_for_status()
        logger.info("updating user profile changes returned successfully")
        return response

    except Exception as e:
        logger.error(f"Error dispatching update_user_profile: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)


async def update_my_profile(
    request: Request,
    user_data: UserProfileUpdateRequest,
    user_access_token,
) -> ProfileResponse:
    """
    Update the authenticated user's profile.

    Validates user identity, merges updates with existing profile data,
    and returns the updated profile with masked phone numbers.

    Args:
        request: FastAPI request object
        user_data: Profile update request data
        user_access_token: User's authentication token

    Returns:
        ProfileResponse: Updated profile data with masked phone numbers

    Raises:
        HTTPException: For authentication, authorization, or validation errors
    """
    logger.info("Starting user profile update")

    updated_user_data_dict = sanitize_user_profile_data(user_data)

    ibm_user_profile_response = await dispatch_get_my_profile_from_ibm(
        request, user_access_token
    )
    ibm_user_profile = ibm_user_profile_response.model_dump()

    ibm_user_profile_username = ibm_user_profile.get("userName")
    current_users_username = updated_user_data_dict.get("userName")
    username_match = ibm_user_profile_username == current_users_username

    if not username_match:
        logger.error("User mismatch - cannot update profile")
        raise HTTPException(
            status_code=403, detail="User mismatch - cannot update profile"
        )

    # Prevent changing the userName
    updated_user_data_dict.pop("userName", None)

    merged_profile = {**ibm_user_profile, **updated_user_data_dict}

    validate_merged_profile = IBMVerifyUpdateUserProfile(**merged_profile)

    user_profile_payload = validate_merged_profile.model_dump_json(
        by_alias=True, exclude_none=True
    )

    response = await dispatch_update_user_profile(
        request, user_profile_payload, user_access_token
    )
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
        message="User profile updated successfully.",
        data=response_data,
    )
