import json
import logging
from datetime import datetime

from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError

from app.config import get_settings
from app.otp.schemas import OtpType
from app.users.schemas import (
    TwoFactorEnrollmentUserData,
    TwofactorEnrollmentResponse,
    TwoFactorEnrollmentType,
)
from app.utils.access_token import get_access_token, get_auth_request_headers
from app.utils.helpers import generate_error_response
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def handle_enrolling_user_into_2fa(
    two_factor_enrollment_data: TwoFactorEnrollmentUserData,
    global_http_client: AsyncClient,
):

    try:
        start_time = datetime.now()
        response = await enroll_user(two_factor_enrollment_data, global_http_client)
        response_json = response.json()

        if response.status_code != 201:
            logger.error(
                f"Failed to enroll user in {two_factor_enrollment_data.enrollmentType} 2FA. Response: {response.json()}"
            )
            return generate_error_response(response.status_code, response.json())

        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"2FA enrollment request completed in {duration:.2f} seconds")

        try:
            validated_data = TwofactorEnrollmentResponse(**response_json)
        except ValidationError as e:
            logger.error(f"Validation Error: {e.json()}")
            print(json.dumps(e.json(), indent=4))
            raise HTTPException(status_code=422, detail="Response validation error")

        return ResponseModel(
            success=True,
            data=validated_data,
            message=f"User enrolled into {two_factor_enrollment_data.enrollmentType} 2FA  successfully",
        )

    except HTTPException as he:
        logger.error(f"HTTP Exception in 2FA enrollment: {str(he)}")
        raise he
    except Exception as e:
        logger.error(
            f"{two_factor_enrollment_data.enrollmentType} 2FA enrollment error: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=400,
            detail=f"{two_factor_enrollment_data.enrollmentType} 2FA verification enrollment error: {str(e)}",
        )


async def enroll_user(two_factor_enrollment_data, global_http_client):
    try:
        access_token = await get_access_token()
        headers = get_auth_request_headers(access_token, True)
        settings = get_settings().ibm_verify_config

        if two_factor_enrollment_data.enrollmentType == TwoFactorEnrollmentType.SMS:
            otp_type_endpoint_url = (
                f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp"
            )
        elif two_factor_enrollment_data.enrollmentType == TwoFactorEnrollmentType.VOICE:
            otp_type_endpoint_url = (
                f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp"
            )

        user_data = {
            "userId": two_factor_enrollment_data.userId,
            "phoneNumber": "".join(
                c for c in two_factor_enrollment_data.phoneNumber if c.isdigit()
            ),  # Verify's transient sms and voice OTPs do not accept non-numbers in the input string
            "enabled": "true",
        }

        response = await global_http_client.post(
            otp_type_endpoint_url, json=user_data, headers=headers
        )
        return response

    except HTTPException as he:
        logger.error(
            f"HTTP Exception in {two_factor_enrollment_data.enrollmentType} 2FA enrollment: {str(he)}"
        )
        raise he
    except Exception as e:
        logger.error(
            f"{two_factor_enrollment_data.enrollmentType} 2FA enrollment error: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=400,
            detail=f"{two_factor_enrollment_data.enrollmentType} 2FA enrollment error: {str(e)}",
        )
