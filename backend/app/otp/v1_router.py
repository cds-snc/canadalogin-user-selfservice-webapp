import logging

from app.auth.services.auth_user_session import get_users_current_session
from app.otp.schemas import (
    OtpEnrollmentRequest,
    OtpRequestResponse,
    OtpType,
    OtpVerificationAttemptRequest,
    OtpVerificationCreateRequest,
    RetrievalData,
    UserOtpInfo,
    UserOtpVerificationInfo,
)
from app.otp.services.enroll_mfa_otp import handle_otp_enrollment
from app.otp.services.retrieve_transient_otp import handle_otp_status_retrieval
from app.otp.services.send_transient_otp import handle_otp_send
from app.otp.services.verify_mfa_otp import (
    handle_mfa_otp_verification_attempt,
    handle_mfa_otp_verification_create,
)
from app.otp.services.verify_transient_otp import handle_otp_verification
from app.utils.schemas import ResponseModel
from fastapi import APIRouter, Depends, Request, status

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
    "/enroll/mfa",
    response_model=ResponseModel,
    status_code=status.HTTP_201_CREATED,
    tags=["OTP"],
    summary="Enroll MFA OTP factor",
    description="Enrolls a phone number for MFA OTP-based two-factor authentication (SMS or Voice based on otpType)",
)
async def enroll_otp(
    request: Request,
    enrollment_request: OtpEnrollmentRequest,
    user_access_token: str = Depends(get_users_current_session),
):
    return await handle_otp_enrollment(
        request.app.state.request_client, enrollment_request, user_access_token
    )


@router.post(
    "/verify/sms/create",
    response_model=ResponseModel,
    status_code=status.HTTP_201_CREATED,
    tags=["OTP"],
    summary="Create SMS OTP verification",
    description="Creates a new SMS OTP verification and sends the OTP to the enrolled phone number",
)
async def create_sms_otp_verification(
    request: Request,
    verification_request: OtpVerificationCreateRequest,
    user_access_token: str = Depends(get_users_current_session),
):
    return await handle_mfa_otp_verification_create(
        request.app.state.request_client,
        verification_request,
        user_access_token,
        OtpType.SMS,
    )


@router.post(
    "/verify/voice/create",
    response_model=ResponseModel,
    status_code=status.HTTP_201_CREATED,
    tags=["OTP"],
    summary="Create Voice OTP verification",
    description="Creates a new Voice OTP verification and initiates a voice call with the OTP",
)
async def create_voice_otp_verification(
    request: Request,
    verification_request: OtpVerificationCreateRequest,
    user_access_token: str = Depends(get_users_current_session),
):
    return await handle_mfa_otp_verification_create(
        request.app.state.request_client,
        verification_request,
        user_access_token,
        OtpType.VOICE,
    )


@router.post(
    "/verify/sms/attempt",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    tags=["OTP"],
    summary="Attempt SMS OTP verification",
    description="Attempts to verify the user-provided OTP for SMS verification",
)
async def attempt_sms_otp_verification(
    request: Request,
    attempt_request: OtpVerificationAttemptRequest,
    user_access_token: str = Depends(get_users_current_session),
):
    return await handle_mfa_otp_verification_attempt(
        request.app.state.request_client,
        attempt_request,
        user_access_token,
        OtpType.SMS,
    )


@router.post(
    "/verify/voice/attempt",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    tags=["OTP"],
    summary="Attempt Voice OTP verification",
    description="Attempts to verify the user-provided OTP for Voice verification",
)
async def attempt_voice_otp_verification(
    request: Request,
    attempt_request: OtpVerificationAttemptRequest,
    user_access_token: str = Depends(get_users_current_session),
):
    return await handle_mfa_otp_verification_attempt(
        request.app.state.request_client,
        attempt_request,
        user_access_token,
        OtpType.VOICE,
    )
