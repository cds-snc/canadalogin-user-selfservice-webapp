import logging

from fastapi import APIRouter, status
from fastapi import Request

from app.otp.schemas import UserOtpInfo, OtpRequestResponse, UserOtpVerificationInfo, RetrievalData, OtpType
from app.otp.services.retrieve_transient_otp import handle_otp_status_retrieval
from app.otp.services.send_transient_otp import handle_otp_send
from app.otp.services.verify_transient_otp import handle_otp_verification
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/transient_otp/send",
    response_model=OtpRequestResponse,
    status_code=status.HTTP_200_OK,
    tags=["OTP"],
    summary="Sends OTPs: email; voice; or sms",
    description="Attempts to prove a user's phone number or email address",
)
async def send_otp(user_otp_info: UserOtpInfo, request: Request):
    return await handle_otp_send(user_otp_info, request.app.state.request_client)


@router.post(
    "/transient_otp/verify",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    tags=["OTP"],
    summary="Verifies OTPs: email; voice; or SMS",
    description="Attempts to verify a user's phone number or email address",
)
async def verify_otp(verification_data: UserOtpVerificationInfo, request: Request):
    return await handle_otp_verification(
        verification_data, request.app.state.request_client
    )

@router.get(
    "/transient_otp/status/{otpType}/{trxnId}",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    tags=["OTP"],
    summary="Checks on the status of an OTP of any type. Requires a transaction ID (trxnId)",
    description="If the OTP has not expired you will see 'PENDING' - along with timestamps, attempts, and retries.",
)
async def check_otp(trxn_id:str, otp_type: OtpType, request: Request):
    return await handle_otp_status_retrieval(RetrievalData(trxnId=trxn_id, otpType=otp_type),
                                             request.app.state.request_client
    )
