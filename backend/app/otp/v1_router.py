import logging

from fastapi import APIRouter, status
from fastapi import Request, Depends

from app.otp.schemas import (
    UserOtpInfo,
    OtpRequestResponse,
    UserOtpVerificationInfo,
    RetrievalData,
    OtpType,
    OtpEnrollmentRequest,
)
from app.otp.services.retrieve_transient_otp import handle_otp_status_retrieval
from app.otp.services.send_transient_otp import handle_otp_send
from app.otp.services.verify_transient_otp import handle_otp_verification
from app.otp.services.enroll_otp import handle_sms_otp_enrollment, handle_voice_otp_enrollment
from app.utils.schemas import ResponseModel

from app.auth.services.auth_user_session import get_users_current_session

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/transient/send",
    response_model=OtpRequestResponse,
    status_code=status.HTTP_200_OK,
    tags=["OTP"],
    summary="Sends OTPs: email; voice; or sms",
    description="Attempts to prove a user's phone number or email address",
)
async def send_otp(
    request: Request,
    user_otp_info: UserOtpInfo,
    user_access_token: str = Depends(get_users_current_session),
):
    return await handle_otp_send(
        request.app.state.request_client, user_otp_info, user_access_token
    )


@router.post(
    "/transient/verify",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    tags=["OTP"],
    summary="Verifies OTPs: email; voice; or SMS",
    description="Attempts to verify a user's phone number or email address",
)
async def verify_otp(
    request: Request,
    verification_data: UserOtpVerificationInfo,
    user_access_token: str = Depends(get_users_current_session),
):
    return await handle_otp_verification(
        request.app.state.request_client, verification_data
    )


@router.get(
    "/transient/status/{otpType}/{trxnId}",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    tags=["OTP"],
    summary="Checks on the status of an OTP of any type. Requires a transaction ID (trxnId)",
    description="If the OTP has not expired you will see 'PENDING' - along with timestamps, attempts, and retries.",
)
async def check_otp(
    request: Request,
    trxn_id: str,
    otp_type: OtpType,
    user_access_token: str = Depends(get_users_current_session),
):
    return await handle_otp_status_retrieval(
        request.app.state.request_client,
        RetrievalData(trxnId=trxn_id, otpType=otp_type),
    )


@router.post(
    "/enroll/sms",
    response_model=ResponseModel,
    status_code=status.HTTP_201_CREATED,
    tags=["OTP"],
    summary="Enroll SMS OTP factor",
    description="Enrolls a phone number for SMS-based two-factor authentication",
)
async def enroll_sms_otp(
    request: Request,
    enrollment_request: OtpEnrollmentRequest,
    user_access_token: str = Depends(get_users_current_session),
):
    return await handle_sms_otp_enrollment(
        request.app.state.request_client, enrollment_request, user_access_token
    )


@router.post(
    "/enroll/voice",
    response_model=ResponseModel,
    status_code=status.HTTP_201_CREATED,
    tags=["OTP"],
    summary="Enroll Voice OTP factor",
    description="Enrolls a phone number for voice call-based two-factor authentication",
)
async def enroll_voice_otp(
    request: Request,
    enrollment_request: OtpEnrollmentRequest,
    user_access_token: str = Depends(get_users_current_session),
):
    return await handle_voice_otp_enrollment(
        request.app.state.request_client, enrollment_request, user_access_token
    )
