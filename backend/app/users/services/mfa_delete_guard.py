import logging

from app.fido2.services.get_fido2_registrations import get_user_fido2_registrations
from app.users.services.otp_factors import get_user_otp_factors
from fastapi import HTTPException, status
from httpx import AsyncClient

logger = logging.getLogger(__name__)


async def assert_remaining_mfa_factor_after_deletion(
    http_client: AsyncClient,
    user_access_token: str,
    otp_factor_ids_to_delete: set[str] | None = None,
    fido2_registration_ids_to_delete: set[str] | None = None,
) -> None:
    """Ensure the user will retain at least one enabled MFA factor after deletion."""

    otp_factor_ids_to_delete = otp_factor_ids_to_delete or set()
    fido2_registration_ids_to_delete = fido2_registration_ids_to_delete or set()

    otp_factors_response = await get_user_otp_factors(
        http_client, user_access_token, validated=None
    )

    if not otp_factors_response.success:
        logger.warning("Unable to retrieve user MFA factors before deletion")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to retrieve user MFA factors",
        )

    remaining_otp_factors = sum(
        1
        for factor in otp_factors_response.data
        if factor.id not in otp_factor_ids_to_delete
    )

    # If any OTP factors remain, we can safely allow deletion without
    # requiring a FIDO2 lookup.
    if remaining_otp_factors >= 1:
        return

    fido2_registrations_response = await get_user_fido2_registrations(
        http_client, user_access_token
    )

    if not fido2_registrations_response.success:
        logger.warning("Unable to retrieve user FIDO2 factors before deletion")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to retrieve user MFA factors",
        )

    remaining_fido2_factors = sum(
        1
        for registration in (fido2_registrations_response.data.fido2 or [])
        if registration.enabled
        and registration.id not in fido2_registration_ids_to_delete
    )

    if remaining_otp_factors + remaining_fido2_factors < 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete last remaining MFA factor",
        )
