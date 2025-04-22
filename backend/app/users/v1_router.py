from fastapi import APIRouter, Depends, status

from app.otp.schemas import OtpType
from app.users.schemas import UserLoginRequestData, SignUpResponse, AuthenticatedUserResponse, \
    TwoFactorEnrollmentUserData, VerifiedTwofactorEnrollmentResponse
from app.users.services.create import signup_with_password
from app.users.services.login import signin_with_password
from app.users.services.two_factor_enrollment import handle_enrolling_user_into_2fa
from app.utils.helpers import generate_error_response
import logging
from fastapi import Request


router = APIRouter()
logger = logging.getLogger(__name__)


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
            response_model=VerifiedTwofactorEnrollmentResponse,
            tags=["Users"],
            summary="Enrols user into Voice or SMS 2FA ",
            description="Basic Authentication - Email and Password")
async def user_2fa_enroll(user_enrollment_data: TwoFactorEnrollmentUserData, otp_type: OtpType, request: Request):

    if otp_type == OtpType.EMAIL:
        logger.error("As per CDS - cannot use email as a 2FA type")
        return generate_error_response(400, "Unknown error")

    elif OtpType.VOICE or OtpType.SMS:
        return await handle_enrolling_user_into_2fa(user_enrollment_data, otp_type, request.app.state.request_client)

    else:
        return generate_error_response(400, "Unknown error")
