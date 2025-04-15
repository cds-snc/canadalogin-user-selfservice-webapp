import logging
from datetime import datetime

from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError
from starlette.requests import Request
import json
from app.config import get_settings
from app.users.schemas import TwoFactorEnrollmentUserData, VerifyTwofactorEnrollmentResponse
from app.utils.access_token import get_access_token, get_auth_request_headers
from app.utils.helpers import generate_error_response
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)

http_client: AsyncClient

async def handle_enrolling_user_into_2fa(two_factor_enrollment_data: TwoFactorEnrollmentUserData, otp_type: str, global_http_client: AsyncClient):
    global http_client
    http_client = global_http_client
    try:

        start_time = datetime.now()
        response = await enroll_user(two_factor_enrollment_data, otp_type)

        response_json = response.json()
        if response.status_code != 201:
            error_message = response_json.get('detail', 'Unknown error')
            logger.error(
                f"Failed to enroll user in {otp_type} 2FA. Response: {error_message}")
            return generate_error_response(response.status_code, error_message)

        duration = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"2FA enrollment request completed in {duration:.2f} seconds")

        try:
            validated_data = VerifyTwofactorEnrollmentResponse(**response_json)
        except ValidationError as e:
            logger.error(f"Validation Error: {e.json()}")
            print(json.dumps(e.json(), indent=4))
            raise HTTPException(
                status_code=422, detail="Response validation error")

        return ResponseModel(
            success=True,
            data=validated_data,
            message=f"User enrolled into {otp_type} 2FA  successfully")

    except HTTPException as he:
        logger.error(f"HTTP Exception in 2FA enrollment: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"{otp_type} 2FA enrollment error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400, detail=f"{otp_type} verification 2FA enrollment error: {str(e)}")


async def enroll_user(two_factor_enrollment_data: TwoFactorEnrollmentUserData, otp_type: str):
    try:
        access_token = await get_access_token()
        headers = get_auth_request_headers(access_token, True)
        settings = get_settings().ibm_verify_config
        otp_type_endpoint_url = ""
        if otp_type == "sms":
            otp_type_endpoint_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp"
        elif otp_type == "voice":
            otp_type_endpoint_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp"

        user_data = {
            "userId": two_factor_enrollment_data.userId,
            "phoneNumber": two_factor_enrollment_data.phoneNumber,
            "enabled": "true"
        }

        response = await http_client.post(otp_type_endpoint_url, json=user_data, headers=headers)
        return response

    except HTTPException as he:
        logger.error(f"HTTP Exception in {otp_type} 2FA enrollment: {str(he)}")
        raise he
    except Exception as e:
        logger.error(
            f"{otp_type} 2FA enrollment error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400, detail=f"{otp_type} 2FA enrollment error: {str(e)}")
