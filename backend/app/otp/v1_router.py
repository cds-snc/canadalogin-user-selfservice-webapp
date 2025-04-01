from fastapi import APIRouter, status
from app.otp.schemas import UserName, EmailOtpRequestResponse, PhoneNumber, SMSOtpRequestResponse, OtpVerification, VoiceOtpRequestResponse
from app.otp.services.send_email_otp import send_email_otp
from app.otp.services.send_transient_SMS_otp import SendTransientSMSOTP

from app.otp.services.send_transient_voice_otp import SendTransientVoiceOTP
from app.otp.services.verify_transient_SMS_otp import VerifyTransientSMSOTP
from app.otp.services.verify_email_otp import verify_email_otp
from app.otp.services.verify_transient_voice_otp import VerifyTransientVoiceOTP
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
async def verify_user_email_otp(data: OtpVerification):
    """
    Verifies an otp and trxnId for email
    Returns: Transaction ID
    """
    return await verify_email_otp(data)


@router.post("/transient_sms/send",
             response_model=SMSOtpRequestResponse,
             status_code=status.HTTP_200_OK,
             tags=["OTP"],
             summary="Sends a SMS OTP",
             description="Verify a user's phone number")
async def sms_otp(data: PhoneNumber):
    """
    Sends an OTP via SMS
    Returns: Transaction ID
    """
    otp = SendTransientSMSOTP()
    return await otp.handle_transient_sms_otp(data)


@router.post("/transient_sms/verify",
             response_model=ResponseModel,
             status_code=status.HTTP_200_OK,
             tags=["OTP"],
             summary="Verifies a SMS OTP",
             description="Proves a user's phone number")
async def sms_otp(data: OtpVerification):
    """
    Verify an SMS OTP Passcode
    Returns: a verification success message
    """
    otp = VerifyTransientSMSOTP()
    return await otp.handle_transient_sms_otp_verification(data)


@router.post("/transient_voice/send",
             response_model=VoiceOtpRequestResponse,
             status_code=status.HTTP_200_OK,
             tags=["OTP"],
             summary="Sends a voice OTP",
             description="Verifies a user's phone number")
async def send_voice_otp(data: PhoneNumber):
    """
    Sends and OTP via Voice
    Returns: Transaction ID
    """
    otp = SendTransientVoiceOTP()
    return await otp.handle_transient_voice_otp(data)


@router.post("/transient_voice/verify",
             response_model=ResponseModel,
             status_code=status.HTTP_200_OK,
             tags=["OTP"],
             summary="Verifies a voice OTP",
             description="Proves a user's phone number")
async def verify_voice_otp(data: OtpVerification):
    """
    Verify a voice OTP
    Returns: a verification success message
    """
    otp = VerifyTransientVoiceOTP()
    return await otp.handle_transient_voice_otp_verification(data)

