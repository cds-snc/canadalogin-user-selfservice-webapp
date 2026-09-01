import json
import logging
import re
from dataclasses import dataclass

from fastapi import HTTPException, status, Request

from app.config import get_configuration
from app.otp.schemas import OtpDeletionRequest, OtpEnrollmentRequest, OtpType
from app.otp.services.delete_mfa_otp import dispatch_otp_deletion
from app.otp.services.enroll_mfa_otp import (
    dispatch_otp_enrollment,
    dispatch_otp_factor_validation,
)
from app.password.schemas import OtpType as FactorOtpType
from app.users.schemas import (
    ProfileUpdateWithOtpRequest,
    ProfileResponse,
    UserProfileUpdateRequest,
    EmailItem,
)
from app.users.services.get_my_profile import dispatch_get_my_profile_from_ibm
from app.users.services.otp_factors import get_user_otp_factors
from app.users.services.update_my_profile import (
    update_profile_for_verified_changes,
    sanitize_user_profile_data,
)
from app.auth.services.auth_user_session import update_session_user_info
from app.utils.access_token import get_admin_token
from app.utils.helpers import verify_otp_before_operation

logger = logging.getLogger(__name__)

MAX_EMAIL_LENGTH = 128
NON_ASCII_CHARACTER_REGEX = re.compile(r"[^\x00-\x7F]")


@dataclass
class EmailMfaSyncContext:
    normalized_new_email: str
    old_email_factor_ids: list[str]
    has_new_email_factor: bool


def _validate_new_email_address(new_email_address: str | None) -> None:
    """Apply business-rule validation for email updates.

    These checks mirror frontend rules so direct API calls cannot bypass them.
    """
    if not new_email_address:
        return

    normalized_email = str(new_email_address).strip().lower()

    if len(normalized_email) > MAX_EMAIL_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="email_too_long",
        )

    if NON_ASCII_CHARACTER_REGEX.search(normalized_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="email_accented_characters",
        )


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

    _validate_new_email_address(profile_update_data.newEmailAddress)

    # Step 1: Validate the OTP first using the helper function
    await verify_otp_before_operation(
        global_http_client=request.app.state.request_client,
        otp=profile_update_data.otp,
        trxn_id=profile_update_data.trxnId,
        otp_type=profile_update_data.otpType,
        user_access_token=user_access_token,
    )

    logger.info("OTP verification successful, preparing profile update workflow")

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

    email_mfa_sync_context: EmailMfaSyncContext | None = None
    email_mfa_theme = _get_email_mfa_theme()

    if profile_update_data.newEmailAddress:
        email_mfa_sync_context = await _build_email_mfa_sync_context(
            request=request,
            user_access_token=user_access_token,
            old_email=current_profile_response.userName,
            new_email=profile_update_data.newEmailAddress,
        )

        if email_mfa_sync_context is not None:
            await _delete_old_email_mfa_factors(
                request=request,
                user_access_token=user_access_token,
                factor_ids=email_mfa_sync_context.old_email_factor_ids,
                preferred_language=current_profile_response.preferredLanguage,
                theme_id=email_mfa_theme,
            )

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

    if email_mfa_sync_context is not None:
        await _enroll_and_validate_new_email_mfa_factor(
            request=request,
            user_access_token=user_access_token,
            user_id=current_profile_response.id,
            new_email=email_mfa_sync_context.normalized_new_email,
            has_new_email_factor=email_mfa_sync_context.has_new_email_factor,
            preferred_language=current_profile_response.preferredLanguage,
            theme_id=email_mfa_theme,
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


def _get_email_mfa_theme() -> str | None:
    """Read and normalize optional EMAIL_MFA_THEME config."""
    theme_id = get_configuration().ibm_verify_config.EMAIL_MFA_THEME
    if not theme_id:
        return None

    normalized_theme_id = theme_id.strip()
    return normalized_theme_id or None


def _normalize_email(value: str | None) -> str:
    return (value or "").strip().lower()


async def _build_email_mfa_sync_context(
    request: Request,
    user_access_token: str,
    old_email: str,
    new_email: str,
) -> EmailMfaSyncContext | None:
    """Prepare email MFA sync metadata for pre/post profile update steps."""
    normalized_old_email = _normalize_email(old_email)
    normalized_new_email = _normalize_email(new_email)

    if not normalized_old_email or not normalized_new_email:
        logger.warning("Skipping email MFA sync due to missing old/new email value")
        return None

    if normalized_old_email == normalized_new_email:
        logger.info("Email MFA sync skipped because email address is unchanged")
        return None

    factors_response = await get_user_otp_factors(
        request.app.state.request_client,
        user_access_token,
        validated=None,
    )

    if not factors_response.success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to retrieve user MFA factors",
        )

    old_email_factor_ids: list[str] = []
    has_new_email_factor = False

    for factor in factors_response.data:
        factor_type = getattr(factor.type, "value", str(factor.type))
        factor_destination = (factor.destination or "").strip().lower()

        if factor_type != FactorOtpType.EMAILOTP.value:
            continue

        if factor_destination == normalized_new_email:
            has_new_email_factor = True

        if factor_destination == normalized_old_email:
            old_email_factor_ids.append(factor.id)

    return EmailMfaSyncContext(
        normalized_new_email=normalized_new_email,
        old_email_factor_ids=old_email_factor_ids,
        has_new_email_factor=has_new_email_factor,
    )


async def _delete_old_email_mfa_factors(
    request: Request,
    user_access_token: str,
    factor_ids: list[str],
    preferred_language: str | None,
    theme_id: str | None,
) -> None:
    language = preferred_language or "en"

    for factor_id in factor_ids:
        logger.info(f"Deleting old email MFA factor before profile update: {factor_id}")
        await dispatch_otp_deletion(
            global_http_client=request.app.state.request_client,
            deletion_request=OtpDeletionRequest(id=factor_id, otpType=OtpType.EMAIL),
            user_access_token=user_access_token,
            language=language,
            theme_id=theme_id,
        )


async def _enroll_and_validate_new_email_mfa_factor(
    request: Request,
    user_access_token: str,
    user_id: str,
    new_email: str,
    has_new_email_factor: bool,
    preferred_language: str | None,
    theme_id: str | None,
) -> None:
    language = preferred_language or "en"

    if has_new_email_factor:
        logger.info("Email MFA enrollment skipped because new factor already exists")
        return

    logger.info("Enrolling new email MFA factor after profile update")
    enrollment_response = await dispatch_otp_enrollment(
        global_http_client=request.app.state.request_client,
        enrollment_request=OtpEnrollmentRequest(
            destination=new_email,
            otpType=OtpType.EMAIL,
        ),
        user_id=user_id,
        user_access_token=user_access_token,
        language=language,
        theme_id=theme_id,
    )

    enrolled_factor_payload = enrollment_response.json()
    enrolled_factor_id = enrolled_factor_payload["id"]

    # Follow IBM Verify flow: take enrollment response body, then set validated=true.
    validation_payload = dict(enrolled_factor_payload)
    validation_payload["validated"] = True

    # Temporary debug output to copy the exact payload into Bruno.
    print(json.dumps(validation_payload))

    admin_access_token = await get_admin_token(request.app.state.request_client)

    logger.info(f"Validating newly enrolled email MFA factor: {enrolled_factor_id}")
    await dispatch_otp_factor_validation(
        global_http_client=request.app.state.request_client,
        factor_id=enrolled_factor_id,
        otp_type=OtpType.EMAIL,
        factor_payload=validation_payload,
        user_access_token=admin_access_token,
        language=language,
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
