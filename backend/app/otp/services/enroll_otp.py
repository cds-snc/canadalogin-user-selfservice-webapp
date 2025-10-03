import logging
from datetime import datetime

from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError

from app.config import get_configuration
from app.otp.schemas import (
    OtpEnrollmentRequest,
    EnrollmentResponseData
)
from app.users.services.profile import my_profile
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.helpers import (
    generate_error_response,
    prepare_pydantic_phone_number_for_verify,
)
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def handle_sms_otp_enrollment(
    global_http_client: AsyncClient,
    enrollment_request: OtpEnrollmentRequest,
    user_access_token: str
):
    """Enroll a phone number for SMS OTP authentication"""
    try:
        logger.info("Attempting to enroll SMS OTP factor")
        start_time = datetime.now()

        # Verify user profile
        my_profile_response = await my_profile(global_http_client, user_access_token)
        if not my_profile_response.success:
            logger.error("Failed to get user profile for SMS enrollment")
            return ResponseModel(
                success=False,
                data=None,
                message="User verification failed"
            )

        user_id = my_profile_response.data.id
        logger.info(f"Enrolling SMS OTP for user: {user_id}")

        http_client_response = await dispatch_sms_enrollment(
            global_http_client, enrollment_request, user_id
        )
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"SMS OTP enrollment request completed in {duration:.2f} seconds")

        if http_client_response.status_code is None:
            return generate_error_response(400, "Unknown error")

        if http_client_response.status_code != 201:
            logger.error(f"Error enrolling SMS OTP: {http_client_response.json()}")
            error_data = http_client_response.json()
            error_message = error_data.get("error", "SMS OTP enrollment failed")
            return ResponseModel(
                success=False,
                data=None,
                message=error_message
            )

        response_json = http_client_response.json()

        try:
            # Parse the enrollment response
            enrollment_data = EnrollmentResponseData(
                id=response_json.get("id"),
                userId=response_json.get("userId"),
                type=response_json.get("type"),
                phoneNumber=enrollment_request.phoneNumber,
                created=response_json.get("created"),
                updated=response_json.get("updated"),
                enabled=response_json.get("enabled", True),
                validated=response_json.get("validated", False)
            )

            return ResponseModel(
                success=True,
                data=enrollment_data,
                message="SMS OTP factor enrolled successfully"
            )

        except ValidationError as e:
            logger.error(f"Validation Error: {e.json()}")
            return generate_error_response(422, "Server Error")

    except Exception as e:
        logger.error(f"SMS OTP enrollment error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"SMS OTP enrollment error: {str(e)}"
        )


async def handle_voice_otp_enrollment(
    global_http_client: AsyncClient,
    enrollment_request: OtpEnrollmentRequest,
    user_access_token: str
):
    """Enroll a phone number for Voice OTP authentication"""
    try:
        logger.info("Attempting to enroll Voice OTP factor")
        start_time = datetime.now()

        # Verify user profile
        my_profile_response = await my_profile(global_http_client, user_access_token)
        if not my_profile_response.success:
            logger.error("Failed to get user profile for Voice enrollment")
            return ResponseModel(
                success=False,
                data=None,
                message="User verification failed"
            )

        user_id = my_profile_response.data.id
        logger.info(f"Enrolling Voice OTP for user: {user_id}")

        http_client_response = await dispatch_voice_enrollment(
            global_http_client, enrollment_request, user_id
        )
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"Voice OTP enrollment request completed in {duration:.2f} seconds")

        if http_client_response.status_code is None:
            return generate_error_response(400, "Unknown error")

        if http_client_response.status_code != 201:
            logger.error(f"Error enrolling Voice OTP: {http_client_response.json()}")
            error_data = http_client_response.json()
            error_message = error_data.get("error", "Voice OTP enrollment failed")
            return ResponseModel(
                success=False,
                data=None,
                message=error_message
            )

        response_json = http_client_response.json()

        try:
            # Parse the enrollment response
            enrollment_data = EnrollmentResponseData(
                id=response_json.get("id"),
                userId=response_json.get("userId"),
                type=response_json.get("type"),
                phoneNumber=enrollment_request.phoneNumber,
                created=response_json.get("created"),
                updated=response_json.get("updated"),
                enabled=response_json.get("enabled", True),
                validated=response_json.get("validated", False)
            )

            return ResponseModel(
                success=True,
                data=enrollment_data,
                message="Voice OTP factor enrolled successfully"
            )

        except ValidationError as e:
            logger.error(f"Validation Error: {e.json()}")
            return generate_error_response(422, "Server Error")

    except Exception as e:
        logger.error(f"Voice OTP enrollment error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Voice OTP enrollment error: {str(e)}"
        )


async def dispatch_sms_enrollment(
    global_http_client: AsyncClient,
    enrollment_request: OtpEnrollmentRequest,
    user_id: str
):
    """Dispatch SMS OTP enrollment to IBM Verify"""
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
            "phoneNumber": formatted_phone
        }

        enrollment_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp"
        response = await global_http_client.post(
            enrollment_url, json=enrollment_data, headers=headers
        )
        return response

    except HTTPException as he:
        logger.error(f"HTTP Exception in SMS OTP enrollment: {str(he)}")
        raise he
    except Exception as error:
        logger.error(
            f"Request to /v2.0/factors/smsotp error: {str(error)}",
            exc_info=True
        )
        raise error


async def dispatch_voice_enrollment(
    global_http_client: AsyncClient,
    enrollment_request: OtpEnrollmentRequest,
    user_id: str
):
    """Dispatch Voice OTP enrollment to IBM Verify"""
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
            "phoneNumber": formatted_phone
        }

        enrollment_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp"
        response = await global_http_client.post(
            enrollment_url, json=enrollment_data, headers=headers
        )
        return response

    except HTTPException as he:
        logger.error(f"HTTP Exception in Voice OTP enrollment: {str(he)}")
        raise he
    except Exception as error:
        logger.error(
            f"Request to /v2.0/factors/voiceotp error: {str(error)}",
            exc_info=True
        )
        raise error
