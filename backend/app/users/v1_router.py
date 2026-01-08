import logging

from fastapi import APIRouter
from fastapi import Request, Depends

from app.users.schemas import (
    ProfileResponse,
    UserProfileUpdateRequest,
    RelyingPartyResponse,
    UserPhoneAuthFactorsResponse,
    ProfileUpdateWithOtpRequest,
)
from app.users.services.get_my_profile import get_my_profile
from app.users.services.update_my_profile import update_my_profile
from app.users.services.rp_info import get_relying_party_info
from app.users.services.otp_factors import get_user_otp_factors
from app.users.services.update_profile_with_otp import (
    update_profile_with_otp_verification,
)

from app.auth.services.auth_user_session import get_users_current_session
from app.utils.validate_user_request_match import validate_user_id_matches_session

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/profile",
    response_model=ProfileResponse,
    tags=["Users"],
    summary="Update a user profile in verify",
    description="",
)
async def user_profile(
    request: Request,
    user_data: UserProfileUpdateRequest,
    user_access_token: str = Depends(get_users_current_session),
):
    await validate_user_id_matches_session(request, user_access_token, user_data.user_id)

    return await update_my_profile(
        request,
        user_data,
        user_access_token,
    )


@router.get(
    "/profile",
    response_model=ProfileResponse,
    tags=["Users"],
    summary="Get a single user's profile",
    description="",
)
async def profile(
    request: Request, user_access_token: str = Depends(get_users_current_session)
):
    return await get_my_profile(
        request.app.state.request_client,
        user_access_token,
    )


@router.get(
    "/rp_info",
    response_model=RelyingPartyResponse,
    tags=["Users"],
    summary="Get rp info",
    description="",
)
async def rp_info(
    request: Request,
    user_access_token: None = Depends(get_users_current_session),
):
    return await get_relying_party_info(request)


@router.get(
    "/{user_id}/otp_factors",
    response_model=UserPhoneAuthFactorsResponse,
    tags=["Users"],
    summary="Get the users phone number authentication factors",
    description="",
)
async def user_factors(
    request: Request,
    user_id: str,
    validated: bool = True,
    user_access_token: str = Depends(get_users_current_session),
):
    return await get_user_otp_factors(
        request.app.state.request_client,
        user_id,
        user_access_token,
        validated,
    )


@router.post(
    "/profile/update-with-otp",
    response_model=ProfileResponse,
    tags=["Users"],
    summary="Update any profile field with OTP verification",
    description="Generalized endpoint to atomically validate OTP and update any profile field (email, name, phone, language). Ensures profile changes only occur after successful OTP verification.",
)
async def update_user_profile_with_otp_verification(
    request: Request,
    profile_update_data: ProfileUpdateWithOtpRequest,
    user_access_token: str = Depends(get_users_current_session),
):
    """
    Update any user profile field after OTP verification.

    This generalized endpoint provides secure profile updates for:
    - Email address (updates both email and username)
    - Full name (givenName, familyName, formatted)
    - Phone numbers (contact phone numbers)
    - Preferred language (locale preference)

    The endpoint ensures security by:
    1. First validating the provided OTP code
    2. Only after successful OTP verification, updating the specified profile fields
    3. Updating the user session if email/username changed
    4. Maintaining atomicity - either all updates succeed or none do

    At least one profile field must be provided for update. The OTP type should
    match the delivery method used (email, sms, voice).
    """
    return await update_profile_with_otp_verification(
        request,
        profile_update_data,
        user_access_token,
    )
