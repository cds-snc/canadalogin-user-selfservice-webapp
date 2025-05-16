from fastapi import APIRouter, status

from app.users.schemas import (
    UserLoginRequestData,
    SignUpResponse,
    AuthenticatedUserResponse,
    TwoFactorEnrollmentUserData,
    VerifiedTwofactorEnrollmentResponse,
    ProfileCreateResponse,
    ProfileUserData,
    ProfileGetUserData,
    ProfileGetResponse,
)
from app.users.services.create import signup_with_password
from app.users.services.login import signin_with_password
from app.users.services.two_factor_enrollment import handle_enrolling_user_into_2fa
from app.users.services.profile import create_profile, get_profile

import logging
from fastapi import Request


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/create",
    response_model=SignUpResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Users"],
    summary="Creates a new user",
    description="Basic Authentication - Email and Password",
)
async def user_signup(user: UserLoginRequestData, request: Request):
    """
    Creates a new user.
    Returns: ID and Username
    """
    return await signup_with_password(user, request.app.state.request_client)


@router.post(
    "/login",
    response_model=AuthenticatedUserResponse,
    tags=["Users"],
    summary="Authenticate user - basic authentication",
    description="Basic Authentication - Email and Password",
)
async def user_password_signin(user: UserLoginRequestData, request: Request):
    """
    Creates a new user.
    Returns: ID and Username
    """
    return await signin_with_password(user, request.app.state.request_client)


@router.post(
    "/2fa/enroll",
    response_model=VerifiedTwofactorEnrollmentResponse,
    tags=["Users"],
    summary="Enrols user into Voice or SMS 2FA ",
    description="",
)
async def user_2fa_enroll(
    user_enrollment_data: TwoFactorEnrollmentUserData, request: Request
):
    return await handle_enrolling_user_into_2fa(
        user_enrollment_data, request.app.state.request_client
    )


@router.post(
    "/profile",
    response_model=ProfileCreateResponse,
    tags=["Users"],
    summary="Create user profile in verify",
    description="",
)
async def user_create_profile(user_data: ProfileUserData, request: Request):
    return await create_profile(user_data, request.app.state.request_client)


@router.get(
    "/profile",
    response_model=ProfileGetResponse,
    tags=["Users"],
    summary="Get a single user's profile",
    description="",
)
async def user_get_profile(user_data: ProfileGetUserData, request: Request):
    return await get_profile(user_data, request.app.state.request_client)
