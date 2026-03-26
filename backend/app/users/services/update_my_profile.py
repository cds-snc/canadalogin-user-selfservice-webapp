import logging

from fastapi import Request
from httpx import Response

from app.users.schemas import (
    IBMVerifyUserProfileSchema,
    ProfileResponse,
    UserProfileUpdateRequest,
    IBMVerifyUpdateUserProfile,
)
from app.utils.access_token import get_auth_request_headers
from app.utils.mask_user_profile import mask_profile_details
from app.users.services.get_my_profile import dispatch_get_my_profile_from_ibm
from app.constants.schema_field_names import USER_ID_FIELD, USERNAME_FIELD

logger = logging.getLogger(__name__)


async def update_profile_for_verified_changes(
    request: Request,
    user_data: UserProfileUpdateRequest,
    user_access_token: str,
) -> ProfileResponse:
    """
    Update user profile for any fields that have already been OTP-verified.

    This function bypasses the username mismatch check because the changes
    have already been validated through OTP verification. This should ONLY be
    called from the update_profile_with_otp_verification function.

    Supports updating any OTP-verified fields including:
    - Email address (updates both userName and emails fields)
    - Name (givenName, familyName)
    - Phone numbers
    - Preferred language

    Args:
        request: FastAPI request object
        user_data: Profile update request data with OTP-verified changes
        user_access_token: User's authentication token

    Returns:
        ProfileResponse: Updated profile data with masked phone numbers

    Raises:
        HTTPException: For validation or API errors
    """
    logger.info("Starting verified profile update")

    updated_user_data_dict = sanitize_user_profile_data(user_data)

    # Get current profile to merge with updates
    ibm_user_profile_response = await dispatch_get_my_profile_from_ibm(
        request.app.state.request_client, user_access_token
    )
    ibm_user_profile = ibm_user_profile_response.model_dump()

    # For email changes, we allow the userName and emails to be updated
    # since OTP verification has already been completed
    merged_profile = {**ibm_user_profile, **updated_user_data_dict}

    validate_merged_profile = IBMVerifyUpdateUserProfile(**merged_profile)

    user_profile_payload = validate_merged_profile.model_dump_json(
        by_alias=True, exclude_none=True
    )

    response = await dispatch_update_my_profile(
        request, user_profile_payload, user_access_token
    )

    json_data = response.json()

    masked_profile_data = mask_profile_details(json_data)
    response_data = IBMVerifyUserProfileSchema(**masked_profile_data)

    return ProfileResponse(
        success=True,
        message="User profile updated successfully after OTP verification.",
        data=response_data,
    )


def sanitize_user_profile_data(user_data: UserProfileUpdateRequest) -> dict:
    """
    Validate and sanitize user profile update data.

    Args:
        user_data: User profile update request

    Returns:
        dict: Sanitized data with unset and None values excluded
    """
    updated_data_dict = user_data.model_dump(exclude_unset=True, exclude_none=True)
    return updated_data_dict


async def dispatch_update_my_profile(
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
    """
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
    """
    logger.info("Starting user profile update")

    updated_user_data_dict = sanitize_user_profile_data(user_data)

    ibm_user_profile_response = await dispatch_get_my_profile_from_ibm(
        request.app.state.request_client, user_access_token
    )
    ibm_user_profile = ibm_user_profile_response.model_dump()

    # Remove userName and emails from update to prevent any accidental changes
    # Email changes must go through the secure OTP-verified endpoint
    updated_user_data_dict.pop(USERNAME_FIELD, None)
    updated_user_data_dict.pop(USER_ID_FIELD, None)

    merged_profile = {**ibm_user_profile, **updated_user_data_dict}

    validate_merged_profile = IBMVerifyUpdateUserProfile(**merged_profile)

    user_profile_payload = validate_merged_profile.model_dump_json(
        by_alias=True, exclude_none=True
    )

    response = await dispatch_update_my_profile(
        request, user_profile_payload, user_access_token
    )
    json_data = response.json()

    masked_profile_data = mask_profile_details(json_data)

    response_data = IBMVerifyUserProfileSchema(**masked_profile_data)

    return ProfileResponse(
        success=True,
        message="User profile updated successfully.",
        data=response_data,
    )
