from fastapi import APIRouter, Depends, status
from app.otp.schemas import UserName, EmailOtpRequestResponse
from app.otp.services.email_otp import send_email_otp

router = APIRouter()


@router.post("/email/verification",
             response_model=EmailOtpRequestResponse,
             status_code=status.HTTP_200_OK,
             tags=["OTP"],
             summary="Sends an email with a OTP",
             description="Validate a users email ")
async def email_otp(userName: UserName):
    """
    Emails a OTP password
    Returns: Transaction ID
    """
    return await send_email_otp(userName)


# @router.post("/email/verification/{id}",
#              response_model=AuthenticatedUserResponse,
#              tags=["Users"],
#              summary="Authenticate user - basic authentication",
#              description="Basic Authentication - Email and Password")
# async def user_password_signin(user: UserLoginRequestData):
#     """
#     Creates a new user.
#     Returns: ID and Username
#     """
#     return await signin_with_password(user)
