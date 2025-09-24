import logging

from fastapi import APIRouter
from fastapi import Request, Depends

from app.users.schemas import (
    ProfileResponse,
    UserProfileUpdateRequest,
    RelyingPartyResponse,
    UserPhoneAuthFactorsResponse,
)
from app.users.services.profile import update_profile, my_profile
from app.users.services.rp_info import get_relying_party_info
from app.users.services.otp_factors import get_user_otp_factors

from app.auth.services.auth_user_session import get_users_current_session

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
    return await update_profile(
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
    return await my_profile(
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
    return await get_relying_party_info(
        request
    )


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
    user_access_token: str = Depends(get_users_current_session),
):
    return await get_user_otp_factors(
        request.app.state.request_client,
        user_id,
        user_access_token,
    )
