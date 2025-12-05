import logging
from datetime import datetime

from app.config import get_configuration
from app.otp.schemas import EnrollmentResponseData, OtpEnrollmentRequest, OtpType
from app.users.services.get_my_profile import get_my_profile
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.helpers import (
    generate_error_response,
    prepare_pydantic_phone_number_for_verify,
)
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel
from fastapi import HTTPException, status
from httpx import AsyncClient, HTTPStatusError
from pydantic import ValidationError

logger = logging.getLogger(__name__)


async def handle_otp_enrollment(
    global_http_client: AsyncClient,
    enrollment_request: OtpEnrollmentRequest,
    user_access_token: str,
):
    """Enroll a phone number for OTP authentication (SMS or Voice)"""
    try:
        otp_type = enrollment_request.otpType
        logger.info(f"Attempting to enroll {otp_type} OTP factor")
        start_time = datetime.now()

        # Verify user profile
        my_profile_response = await get_my_profile(
            global_http_client, user_access_token
        )
        if not my_profile_response.success:
            logger.error(f"Failed to get user profile for {otp_type} enrollment")
            return ResponseModel(
                success=False, data=None, message="User verification failed"
            )

        user_id = my_profile_response.data.id
        logger.info(f"Enrolling {otp_type} OTP for user: {user_id}")

        http_client_response = await dispatch_otp_enrollment(
            global_http_client, enrollment_request, user_id
        )
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"{otp_type} OTP enrollment request completed in {duration:.2f} seconds"
        )

        if http_client_response.status_code is None:
            return generate_error_response(400, "Unknown error")

        if http_client_response.status_code != 201:
            logger.error(
                f"Error enrolling {otp_type} OTP: {http_client_response.json()}"
            )
            error_data = http_client_response.json()
            error_message = error_data.get("error", f"{otp_type} OTP enrollment failed")
            return ResponseModel(success=False, data=None, message=error_message)

        response_json = http_client_response.json()

        try:
            # Parse the enrollment response
            # Add phoneNumber from request since it may not be in IBM response
            response_json["phoneNumber"] = enrollment_request.phoneNumber
            enrollment_data = EnrollmentResponseData(**response_json)

            return ResponseModel(
                success=True,
                data=enrollment_data,
                message=f"{otp_type.value} OTP factor enrolled successfully",
            )

        except ValidationError as e:
            logger.error(f"Validation Error: {e.json()}")
            return generate_error_response(422, "Server Error")

    except Exception as e:
        logger.error(
            f"{enrollment_request.otpType} OTP enrollment error: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to enroll MFA phone number",
        )


async def dispatch_otp_enrollment(
    global_http_client: AsyncClient,
    enrollment_request: OtpEnrollmentRequest,
    user_id: str,
):
    """Dispatch OTP enrollment to IBM Verify (SMS or Voice)"""
    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_configuration().ibm_verify_config

        # Format phone number for IBM Verify
        formatted_phone = prepare_pydantic_phone_number_for_verify(
            enrollment_request.phoneNumber
        )

        enrollment_data = {
            "userId": user_id,
            "phoneNumber": formatted_phone,
            "enabled": True,  # Enable the factor immediately upon enrollment
        }

        # Determine the endpoint based on OTP type
        if enrollment_request.otpType == OtpType.SMS:
            endpoint = "smsotp"
        elif enrollment_request.otpType == OtpType.VOICE:
            endpoint = "voiceotp"
        else:
            raise ValueError(f"Unsupported OTP type: {enrollment_request.otpType}")

        enrollment_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/{endpoint}"
        response = await global_http_client.post(
            enrollment_url, json=enrollment_data, headers=headers
        )
        response.raise_for_status()
        return response

    except HTTPStatusError as e:
        return RequestErrorHandler.handle(e)
    except Exception as error:
        logger.error(
            f"Request to /v2.0/factors/{endpoint if 'endpoint' in locals() else 'unknown'} error: {str(error)}",
            exc_info=True,
        )
        # Don't expose server errors to client
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to enroll MFA phone number",
        )
