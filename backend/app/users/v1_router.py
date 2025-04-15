from fastapi import APIRouter, status
from starlette.requests import Request

from app.users.schemas import UserLoginRequestData, SignUpResponse, AuthenticatedUserResponse, TwoFactorEnrollmentUserData, VerifyTwofactorResponse
from app.users.services.create import signup_with_password
from app.users.services.login import signin_with_password
from app.users.services.two_factor_enrollment import handle_enrolling_user_into_2fa

router = APIRouter()


@router.post("/create",
             response_model=SignUpResponse,
             status_code=status.HTTP_201_CREATED,
             tags=["Users"],
             summary="Creates a new user",
             description="Basic Authentication - Email and Password")
async def user_signup(user: UserLoginRequestData):
    """
    Creates a new user.
    Returns: ID and Username
    """
    return await signup_with_password(user)


@router.post("/login",
             response_model=AuthenticatedUserResponse,
             tags=["Users"],
             summary="Authenticate user - basic authentication",
             description="Basic Authentication - Email and Password")
async def user_password_signin(user: UserLoginRequestData):
    """
    Creates a new user.
    Returns: ID and Username
    """
    return await signin_with_password(user)

@router.post("/2fa/enroll/{otp_type}",
             response_model=VerifyTwofactorResponse,
             tags=["Users"],
             summary="Enroll a use into a 2-factor authentication method",
             description="The user ID in this case is not the user's email address, but the user ID from when the user is created.<br>'otp_type' should be 'sms' or 'voice'")
async def user_password_signin(data: TwoFactorEnrollmentUserData, request: Request):
    return await handle_enrolling_user_into_2fa(data, request.path_params['otp_type'], request.app.state.request_client)
