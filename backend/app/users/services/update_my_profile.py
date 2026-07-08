import logging

from fastapi import HTTPException, Request, status
from httpx import Response

from app.users.schemas import (
    IBMVerifyUserProfileSchema,
    ProfileResponse,
    UserProfileUpdateRequest,
    IBMVerifyUpdateUserProfile,
    SCIM_IBM_USER_EXT,
)
from app.utils.access_token import get_auth_request_headers
from app.utils.mask_user_profile import mask_profile_details
from app.users.services.get_my_profile import dispatch_get_my_profile_from_ibm
from app.constants.schema_field_names import USER_ID_FIELD, USERNAME_FIELD

MAX_NAME_LENGTH = 80

logger = logging.getLogger(__name__)


def merge_profile_updates(current_profile: dict, updated_fields: dict) -> dict:
    """Recursively merge nested profile fields so unchanged attributes are preserved."""
    merged_profile = current_profile.copy()

    for key, value in updated_fields.items():
        current_value = merged_profile.get(key)
        if isinstance(current_value, dict) and isinstance(value, dict):
            merged_profile[key] = merge_profile_updates(current_value, value)
        else:
            merged_profile[key] = value

    return merged_profile


def set_identity_verified(profile: dict, is_verified: bool) -> dict:
    # Upsert only identityVerified so we do not overwrite unrelated customAttributes.
    """Ensure IBM extension customAttributes contains identityVerified with requested value."""
    extension = profile.get("details")
    if not isinstance(extension, dict):
        extension = profile.get(SCIM_IBM_USER_EXT)
    if not isinstance(extension, dict):
        extension = {}

    custom_attributes = extension.get("customAttributes")
    if not isinstance(custom_attributes, list):
        custom_attributes = []

    attribute_updated = False
    for attribute in custom_attributes:
        if isinstance(attribute, dict) and attribute.get("name") == "identityVerified":
            attribute["values"] = ["true" if is_verified else "false"]
            attribute_updated = True
            break

    if not attribute_updated:
        custom_attributes.append(
            {
                "name": "identityVerified",
                "values": ["true" if is_verified else "false"],
            }
        )

    extension["customAttributes"] = custom_attributes
    profile["details"] = extension
    profile.pop(SCIM_IBM_USER_EXT, None)
    return profile


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
    identity_verified = updated_user_data_dict.pop("identityVerified", None)

    # Get current profile to merge with updates
    ibm_user_profile_response = await dispatch_get_my_profile_from_ibm(
        request.app.state.request_client, user_access_token
    )
    ibm_user_profile = ibm_user_profile_response.model_dump()

    # For email changes, we allow the userName and emails to be updated
    # since OTP verification has already been completed
    merged_profile = merge_profile_updates(ibm_user_profile, updated_user_data_dict)
    if identity_verified is not None:
        merged_profile = set_identity_verified(merged_profile, identity_verified)

    validate_merged_profile = IBMVerifyUpdateUserProfile(**merged_profile)

    user_profile_payload = validate_merged_profile.model_dump_json(
        by_alias=True, exclude_none=True
    )

    response = await dispatch_update_my_profile(
        request, user_profile_payload, user_access_token
    )

    json_data = response.json()

    parsed_response = IBMVerifyUserProfileSchema(**json_data)
    masked_profile_data = mask_profile_details(parsed_response.model_dump())
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


def validate_name_update(user_data: UserProfileUpdateRequest) -> None:
    """
    Validate name fields on a profile update request.

    Raises HTTPException with an error code that the frontend
    can map to a translated user-facing message.
    """
    if user_data.name is None:
        return

    family_name = (user_data.name.familyName or "").strip()
    given_name = (user_data.name.givenName or "").strip()

    if user_data.name.familyName is not None and not family_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="lastNameRequired",
        )

    if len(given_name) > MAX_NAME_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="firstNameMaxLength",
        )

    if len(family_name) > MAX_NAME_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="lastNameMaxLength",
        )


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

    validate_name_update(user_data)

    updated_user_data_dict = sanitize_user_profile_data(user_data)
    identity_verified = updated_user_data_dict.pop("identityVerified", None)

    ibm_user_profile_response = await dispatch_get_my_profile_from_ibm(
        request.app.state.request_client, user_access_token
    )
    ibm_user_profile = ibm_user_profile_response.model_dump()

    # Remove userName and emails from update to prevent any accidental changes
    # Email changes must go through the secure OTP-verified endpoint
    updated_user_data_dict.pop(USERNAME_FIELD, None)
    updated_user_data_dict.pop(USER_ID_FIELD, None)

    merged_profile = merge_profile_updates(ibm_user_profile, updated_user_data_dict)
    if identity_verified is not None:
        merged_profile = set_identity_verified(merged_profile, identity_verified)

    validate_merged_profile = IBMVerifyUpdateUserProfile(**merged_profile)

    user_profile_payload = validate_merged_profile.model_dump_json(
        by_alias=True, exclude_none=True
    )

    response = await dispatch_update_my_profile(
        request, user_profile_payload, user_access_token
    )
    json_data = response.json()

    parsed_response = IBMVerifyUserProfileSchema(**json_data)
    masked_profile_data = mask_profile_details(parsed_response.model_dump())
    response_data = IBMVerifyUserProfileSchema(**masked_profile_data)

    return ProfileResponse(
        success=True,
        message="User profile updated successfully.",
        data=response_data,
    )
