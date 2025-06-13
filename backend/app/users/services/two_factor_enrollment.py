import json
import logging
from datetime import datetime

from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError

from app.config import get_settings
from app.users.schemas import (
    TwoFactorEnrollmentUserData,
    TwofactorEnrollmentResponse,
    TwoFactorEnrollmentType,
)
from app.users.services.otp_verified_check import otp_method_is_verified
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.helpers import generate_error_response, format_error_response
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def handle_enrolling_user_into_2fa(
    two_factor_enrollment_data: TwoFactorEnrollmentUserData,
    global_http_client: AsyncClient,
):
    if await otp_method_is_verified(
        global_http_client, None, two_factor_enrollment_data
    ):
        try:
            start_time = datetime.now()
            response = await enroll_user(two_factor_enrollment_data, global_http_client)
            response_json = response.json()

            if response.status_code != 201:
                logger.error(
                    f"Failed to enroll user in {two_factor_enrollment_data.enrollmentType} 2FA. Response: {response.json()}"
                )
                return generate_error_response(
                    response.status_code, format_error_response(response.json())
                )

            duration = (datetime.now() - start_time).total_seconds()
            logger.info(f"2FA enrollment request completed in {duration:.2f} seconds")

            try:
                validated_data = TwofactorEnrollmentResponse(**response_json)
            except ValidationError as e:
                logger.error(f"Validation Error: {e.json()}")
                print(json.dumps(e.json(), indent=4))
                raise HTTPException(status_code=422, detail="Response validation error")

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

        await set_user_preferred_2fa_method(
            two_factor_enrollment_data, global_http_client
        )

        return ResponseModel(
            success=True,
            data=validated_data,
            message=f"User enrolled into {two_factor_enrollment_data.enrollmentType} 2FA  successfully",
        )

    else:
        generate_error_response(400, "User's 2fa method has not been verified")


async def enroll_user(two_factor_enrollment_data, global_http_client):
    try:
        access_token = await get_admin_token(global_http_client)
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


async def set_user_preferred_2fa_method(
    two_factor_enrollment_data: TwoFactorEnrollmentUserData,
    global_http_client: AsyncClient,
):
    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token)
        settings = get_settings().ibm_verify_config

        userid = two_factor_enrollment_data.userId
        edit_profile_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/Users/{userid}"

        data = {
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            "Operations": [
                {
                    "op": "add",
                    "path": "urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification:notifyType",
                    "value": "NONE",
                },
                {
                    "op": "add",
                    "path": "urn:ietf:params:scim:schemas:extension:ibm:2.0:User:customAttributes",
                    "value": [
                        {
                            "name": "preferredtwofactorauthmethod",
                            "values": [f"{two_factor_enrollment_data.enrollmentType}"],
                        }
                    ],
                },
            ],
        }

        response = await global_http_client.patch(
            edit_profile_url, json=data, headers=headers
        )

        if response.status_code == 204:
            logger.info("User profile updated successfully.")

    except HTTPException as he:
        logger.error(
            f"HTTP Exception while setting user's preferred 2fa type {two_factor_enrollment_data.enrollmentType} : {str(he)}"
        )
        raise he

    except Exception as e:
        logger.error(
            f"Exception while setting user's preferred 2fa type {two_factor_enrollment_data.enrollmentType} : {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=400,
            detail=f"HTTP Exception while setting user's preferred 2fa type {two_factor_enrollment_data.enrollmentType} : {str(e)}",
        )
