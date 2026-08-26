import logging
from datetime import datetime

from app.config import get_configuration
from app.otp.schemas import EnrollmentResponseData, OtpEnrollmentRequest, OtpType
from app.users.services.get_my_profile import get_my_profile
from app.utils.access_token import get_auth_request_headers
from app.utils.helpers import (
    prepare_pydantic_phone_number_for_verify,
)
from app.utils.schemas import ResponseModel
from fastapi import HTTPException, status
from httpx import AsyncClient

logger = logging.getLogger(__name__)


async def handle_otp_enrollment(
    global_http_client: AsyncClient,
    enrollment_request: OtpEnrollmentRequest,
    user_access_token: str,
):
    """Enroll a destination for OTP authentication (SMS, Voice, or Email)."""
    otp_type = enrollment_request.otpType
    logger.info(f"Attempting to enroll {otp_type} OTP factor")
    start_time = datetime.now()

    # Verify user profile
    my_profile_response = await get_my_profile(global_http_client, user_access_token)
    if not my_profile_response.success:
        logger.error(f"Failed to get user profile for {otp_type} enrollment")
        return ResponseModel(
            success=False, data=None, message="User verification failed"
        )

    user_id = my_profile_response.data.id
    user_language = my_profile_response.data.preferredLanguage or "en"
    logger.info(
        f"Enrolling {otp_type} OTP for user: {user_id}, language: {user_language}"
    )

    http_client_response = await dispatch_otp_enrollment(
        global_http_client,
        enrollment_request,
        user_id,
        user_access_token,
        user_language,
    )
    duration = (datetime.now() - start_time).total_seconds()
    logger.info(
        f"{otp_type} OTP enrollment request completed in {duration:.2f} seconds"
    )

    if (
        http_client_response.status_code is None
        or http_client_response.status_code != 201
    ):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error enrolling {otp_type} OTP: {http_client_response.json()}",
        )

    response_json = http_client_response.json()

    # Parse the enrollment response
    # Add destination from request since it may not be in IBM response
    response_json["destination"] = enrollment_request.destination
    enrollment_data = EnrollmentResponseData(**response_json)

    return ResponseModel(
        success=True,
        data=enrollment_data,
        message=f"{otp_type.value} OTP factor enrolled successfully",
    )


async def dispatch_otp_enrollment(
    global_http_client: AsyncClient,
    enrollment_request: OtpEnrollmentRequest,
    user_id: str,
    user_access_token: str,
    language: str = None,
):
    """Dispatch OTP enrollment to IBM Verify (SMS, Voice, or Email)."""
    headers = get_auth_request_headers(user_access_token, True, language)
    settings = get_configuration().ibm_verify_config

    enrollment_data = {
        "userId": user_id,
        "enabled": True,  # Enable the factor immediately upon enrollment
    }

    # Determine the endpoint based on OTP type
    if enrollment_request.otpType == OtpType.SMS:
        endpoint = "smsotp"
        formatted_phone = prepare_pydantic_phone_number_for_verify(
            enrollment_request.destination
        )
        if not formatted_phone.startswith("+"):
            formatted_phone = f"+{formatted_phone}"
        enrollment_data["phoneNumber"] = formatted_phone
    elif enrollment_request.otpType == OtpType.VOICE:
        endpoint = "voiceotp"
        formatted_phone = prepare_pydantic_phone_number_for_verify(
            enrollment_request.destination
        )
        if not formatted_phone.startswith("+"):
            formatted_phone = f"+{formatted_phone}"
        enrollment_data["phoneNumber"] = formatted_phone
    elif enrollment_request.otpType == OtpType.EMAIL:
        endpoint = "emailotp"
        enrollment_data["emailAddress"] = enrollment_request.destination.lower()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OTP type: {enrollment_request.otpType}",
        )

    enrollment_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/{endpoint}"
    response = await global_http_client.post(
        enrollment_url, json=enrollment_data, headers=headers
    )
    if response.status_code == status.HTTP_409_CONFLICT:
        duplicate_message = (
            "mfa_email_duplicate"
            if enrollment_request.otpType == OtpType.EMAIL
            else "mfa_phone_duplicate"
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=duplicate_message,
        )
    response.raise_for_status()
    return response
