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

@router.post("/transient_otp/send/{otp_type}",
             response_model=OtpRequestResponse,
             status_code=status.HTTP_200_OK,
             tags=["OTP"],
             summary="Sends OTPs: email; voice; or sms",
             description="Proves a user's phone number or email address")
async def verify_voice_otp(user_otp_info: UserOtpInfo, otp_type: OtpType, request: Request):

    if user_otp_info.phoneNumber and user_otp_info.emailAddress:
        logger.error(f"Choose to send an OTP to a phone number, or and email address. Cannot do both.")
        return generate_error_response(400, "Unknown error")

    elif user_otp_info.phoneNumber and otp_type == OtpType.SMS or otp_type == OtpType.VOICE: #check for correct input combo
        return await handle_otp_send(user_otp_info, otp_type, request.app.state.request_client)

    elif user_otp_info.emailAddress and otp_type.value == OtpType.EMAIL:  #check for correct input combo
        return await handle_otp_send(user_otp_info, otp_type, request.app.state.request_client)

    else:
        logger.error(f"Check that you're sending user_otp_info that matches the url parameter: {otp_type}")
        return generate_error_response(400, "Unknown error")


@router.post("/transient_otp/verify/{otp_type}",
             response_model=ResponseModel,
             status_code=status.HTTP_200_OK,
             tags=["OTP"],
             summary="Sends OTPs: email; voice; or SMS",
             description="Proves a user's phone number or email address")
async def verify_voice_otp(verification_data: UserOtpVerificationInfo, otp_type: OtpType, request: Request):

    return await handle_otp_verification(verification_data, otp_type, request.app.state.request_client)
