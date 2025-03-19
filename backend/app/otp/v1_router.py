from fastapi import APIRouter, Depends, status
from app.otp.schemas import UserName, EmailOtpRequestResponse, EmailOtpVerification
from app.otp.services.send_email_otp import send_email_otp
from app.otp.services.verify_email_otp import verify_email_otp
from app.utils.schemas import ResponseModel


router = APIRouter()


@router.post("/email/send",
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


@router.post("/email/verify",
             response_model=ResponseModel,
             status_code=status.HTTP_200_OK,
             tags=["OTP"],
             summary="Verifies an email OTP",
             description="User sends in the trxnId and OTP to verify the email")
async def verify_user_email_otp(data: EmailOtpVerification):
    """
    Verifies an otp and trxnId for email
    Returns: Transaction ID
    """
    return await verify_email_otp(data)
