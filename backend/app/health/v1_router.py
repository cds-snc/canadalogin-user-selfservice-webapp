from fastapi import APIRouter, status
from pydantic import BaseModel, Field
from datetime import datetime

from app.otp.schemas import UserName, EmailOtpRequestResponse, PhoneNumber, SMSOtpRequestResponse, OtpVerification, VoiceOtpRequestResponse
from app.otp.services.send_email_otp import send_email_otp
from app.otp.services.send_transient_SMS_otp import SendTransientSMSOTP

from app.otp.services.send_transient_voice_otp import SendTransientVoiceOTP
from app.otp.services.verify_transient_SMS_otp import VerifyTransientSMSOTP
from app.otp.services.verify_email_otp import verify_email_otp
from app.otp.services.verify_transient_voice_otp import VerifyTransientVoiceOTP
from app.utils.schemas import ResponseModel


router = APIRouter()

@router.post("/",
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


@router.get("/", response_model=HealthResponse,
            summary="Health Check",
            description="Returns the health status of the service")
async def health_check():
    """
    Health check endpoint to monitor service status.

    This endpoint can be used by monitoring tools to check if the service is running properly.

    Returns:
        HealthResponse: Service health information including status and timestamp
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "gc-signin-backend",
    }

