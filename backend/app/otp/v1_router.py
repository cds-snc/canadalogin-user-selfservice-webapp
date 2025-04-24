import logging

from fastapi import APIRouter, status
from fastapi import Request

from app.otp.schemas import UserOtpInfo, OtpType, OtpRequestResponse, UserOtpVerificationInfo
from app.otp.services.send_transient_otp import handle_otp_send
from app.otp.services.verify_transient_otp import handle_otp_verification
from app.utils.helpers import generate_error_response
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/transient_otp/send",
             response_model=OtpRequestResponse,
             status_code=status.HTTP_200_OK,
             tags=["OTP"],
             summary="Sends OTPs: email; voice; or sms",
             description="Proves a user's phone number or email address")
async def verify_voice_otp(user_otp_info: UserOtpInfo, request: Request):
        return await handle_otp_send(user_otp_info, request.app.state.request_client)

@router.post("/transient_otp/verify",
             response_model=ResponseModel,
             status_code=status.HTTP_200_OK,
             tags=["OTP"],
             summary="Sends OTPs: email; voice; or SMS",
             description="Proves a user's phone number or email address")
async def verify_voice_otp(verification_data: UserOtpVerificationInfo, request: Request):
    return await handle_otp_verification(verification_data, request.app.state.request_client)
