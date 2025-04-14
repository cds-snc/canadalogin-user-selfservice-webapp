from typing import Annotated

from fastapi import APIRouter, status, Depends
from pydantic_settings import BaseSettings

from app.config import Settings, get_settings
from app.otp.schemas import UserName, EmailOtpRequestResponse, PhoneNumber, SMSOtpRequestResponse, OtpVerification, VoiceOtpRequestResponse
from app.otp.services.send_transient_SMS_otp import SendTransientSMSOTP
from app.otp.services.send_transient_email_otp import SendTransientEmailOTP

from app.otp.services.send_transient_voice_otp import SendTransientVoiceOTP
from app.otp.services.verify_transient_SMS_otp import VerifyTransientSMSOTP
from app.otp.services.verify_transient_email_otp import VerifyTransientEmailOTP
from app.otp.services.verify_transient_voice_otp import VerifyTransientVoiceOTP
from app.utils.schemas import ResponseModel
from fastapi import FastAPI, Request




router = APIRouter()


@router.post("/email/send",
             response_model=EmailOtpRequestResponse,
             status_code=status.HTTP_200_OK,
             tags=["OTP"],
             summary="Sends an email with a OTP",
             description="Validate a users email ")
async def email_otp(userName: UserName, request: Request):
    """
    Emails a OTP password
    Returns: Transaction ID
    """
    settings = get_settings().ibm_verify_config
    http_client = request.app.state.request_client
    otp = SendTransientEmailOTP(settings, http_client)
    return await otp.handle_transient_email_otp(userName)


@router.post("/email/verify",
             response_model=ResponseModel,
             status_code=status.HTTP_200_OK,
             tags=["OTP"],
             summary="Verifies an email OTP",
             description="User sends in the trxnId and OTP to verify the email")
async def verify_user_email_otp(data: OtpVerification, request: Request):
    """
    Verifies an otp and trxnId for email
    Returns: Transaction ID
    """
    settings = get_settings().ibm_verify_config
    http_client = request.app.state.request_client
    otp = VerifyTransientEmailOTP(settings,http_client)
    return await otp.handle_transient_email_otp_verification(data)


@router.post("/transient_sms/send",
             response_model=SMSOtpRequestResponse,
             status_code=status.HTTP_200_OK,
             tags=["OTP"],
             summary="Sends a SMS OTP",
             description="Verify a user's phone number")
async def sms_otp(data: PhoneNumber, request: Request):
    """
    Sends an OTP via SMS
    Returns: Transaction ID
    """
    http_client = request.app.state.request_client
    settings = get_settings().ibm_verify_config
    otp = SendTransientSMSOTP(settings, http_client)
    return await otp.handle_transient_sms_otp(data)


@router.post("/transient_sms/verify",
             response_model=ResponseModel,
             status_code=status.HTTP_200_OK,
             tags=["OTP"],
             summary="Verifies a SMS OTP",
             description="Proves a user's phone number")
async def sms_otp(data: OtpVerification, request: Request):
    """
    Verify an SMS OTP Passcode
    Returns: a verification success message
    """
    http_client = request.app.state.request_client
    settings = get_settings().ibm_verify_config
    otp = VerifyTransientSMSOTP(settings, http_client)
    return await otp.handle_transient_sms_otp_verification(data)


@router.post("/transient_voice/send",
             response_model=VoiceOtpRequestResponse,
             status_code=status.HTTP_200_OK,
             tags=["OTP"],
             summary="Sends a voice OTP",
             description="Verifies a user's phone number")
async def send_voice_otp(data: PhoneNumber, request: Request):
    """
    Sends and OTP via Voice
    Returns: Transaction ID
    """
    http_client = request.app.state.request_client
    settings = get_settings().ibm_verify_config
    otp = SendTransientVoiceOTP(settings,http_client)
    return await otp.handle_transient_voice_otp(data)


@router.post("/transient_voice/verify",
             response_model=ResponseModel,
             status_code=status.HTTP_200_OK,
             tags=["OTP"],
             summary="Verifies a voice OTP",
             description="Proves a user's phone number")
async def verify_voice_otp(data: OtpVerification,request: Request):
    """
    Verify a voice OTP
    Returns: a verification success message
    """
    http_client = request.app.state.request_client
    settings = get_settings().ibm_verify_config
    otp = VerifyTransientVoiceOTP(settings, http_client)
    return await otp.handle_transient_voice_otp_verification(data)

