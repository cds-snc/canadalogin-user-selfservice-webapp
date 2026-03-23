import logging

from fastapi import HTTPException, status, Request

from app.users.schemas import (
    ProfileUpdateWithOtpRequest,
    ProfileResponse,
    UserProfileUpdateRequest,
    EmailItem,
)
from app.users.services.get_my_profile import dispatch_get_my_profile_from_ibm
from app.users.services.update_my_profile import (
    update_profile_for_verified_changes,
    sanitize_user_profile_data,
)
from app.auth.services.auth_user_session import update_session_user_info
from app.utils.helpers import verify_otp_before_operation

logger = logging.getLogger(__name__)


async def update_profile_with_otp_verification(
    request: Request,
    profile_update_data: ProfileUpdateWithOtpRequest,
    user_access_token: str,
) -> ProfileResponse:
    """
    Generalized function to atomically validate OTP and update any profile field.

    This ensures profile updates only happen after successful OTP verification.
    Supports updating: email address, name, phone numbers, preferred language.

    Args:
        request: FastAPI request object
        profile_update_data: Profile update request with OTP verification
        user_access_token: User's authentication token

    Returns:
        ProfileResponse: Updated profile data

    Raises:
        HTTPException: For OTP verification failures or profile update errors
    """
    logger.info("Starting atomic profile update with OTP verification")

    # Step 1: Validate the OTP first using the helper function
    await verify_otp_before_operation(
        global_http_client=request.app.state.request_client,
        user_access_token=user_access_token,
        otp=profile_update_data.otp,
        trxn_id=profile_update_data.trxnId,
        otp_type=profile_update_data.otpType,
    )

    logger.info("OTP verification successful, proceeding with profile update")

    # Step 2: Get current user profile to validate user context and prepare updates
    # retrieve the unmasked profile
    current_profile_response = await dispatch_get_my_profile_from_ibm(
        request.app.state.request_client, user_access_token
    )

    if not current_profile_response.userName:
        logger.error("Failed to get current user profile")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve current user profile",
        )

    logger.info(f"Current user: {current_profile_response.id}")

    # Step 3: Build the profile update request based on provided fields
    profile_update_request = _build_profile_update_request(
        profile_update_data, current_profile_response
    )

    logger.info(
        f"Updating profile fields: {_get_update_field_names(profile_update_data)}"
    )

    # Step 4: Update the profile using the secure update function
    profile_update_response = await update_profile_for_verified_changes(
        request, profile_update_request, user_access_token
    )

    if not profile_update_response.success:
        logger.error("Profile update failed after successful OTP verification")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile update failed after OTP verification",
        )

    # Step 5: Update session if email/username was changed
    session_updates = _build_session_updates(profile_update_data)
    if session_updates:
        try:
            logger.info(
                f"Updating session with changes: {list(session_updates.keys())}"
            )
            update_session_user_info(request, session_updates)
            logger.info("Session updated successfully after profile change")
        except Exception as e:
            logger.warning(f"Failed to update session after profile change: {str(e)}")
            # Don't fail the entire operation if session update fails

    logger.info("Profile updated successfully with OTP verification")

    return ProfileResponse(
        success=True,
        message="Profile updated successfully after OTP verification",
        data=profile_update_response.data,
    )


def _build_profile_update_request(
    update_data: ProfileUpdateWithOtpRequest,
    current_profile,
) -> UserProfileUpdateRequest:
    """Build the profile update request, only including fields that are being updated"""

    # Start with the required userName field
    request_data = {"userName": current_profile.userName}

    # Handle email address updates (requires special logic for emails list)
    if update_data.newEmailAddress:
        # For email updates, update both username and emails fields
        # Find and replace the "work" email while preserving other emails
        current_emails = current_profile.emails or []
        updated_emails = []
        work_email_found = False

        # First, preserve non-work emails and replace any existing work email
        for email in current_emails:
            if getattr(email, "type", None) == "work":
                # Replace the work email with the new one
                updated_emails.append(
                    EmailItem(value=update_data.newEmailAddress, type="work")
                )
                work_email_found = True
            else:
                # Preserve non-work emails as-is
                updated_emails.append(email)

        # If no work email was found, add the new work email
        if not work_email_found:
            updated_emails.append(
                EmailItem(value=update_data.newEmailAddress, type="work")
            )

        request_data["userName"] = update_data.newEmailAddress
        request_data["emails"] = updated_emails

    # Add phone numbers if being updated - sanitize_user_profile_data will handle filtering
    if update_data.phoneNumbers is not None:
        request_data["phoneNumbers"] = update_data.phoneNumbers

    # Create the request object and use sanitize function to only include explicitly set fields
    profile_update_request = UserProfileUpdateRequest(**request_data)
    sanitized_data = sanitize_user_profile_data(profile_update_request)
    return UserProfileUpdateRequest(**sanitized_data)


def _get_update_field_names(update_data: ProfileUpdateWithOtpRequest) -> list[str]:
    """Get a list of field names being updated for logging purposes"""
    fields = []

    if update_data.newEmailAddress:
        fields.append("email")
    if update_data.phoneNumbers:
        fields.append("phoneNumbers")

    return fields


def _build_session_updates(update_data: ProfileUpdateWithOtpRequest) -> dict:
    """Build session updates dictionary for fields that affect the user session"""
    session_updates = {}

    # Only email changes affect the session currently
    if update_data.newEmailAddress:
        session_updates.update(
            {
                "preferred_username": update_data.newEmailAddress,
                "email": update_data.newEmailAddress,
            }
        )

    return session_updates
