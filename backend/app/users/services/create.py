import logging
import json
from datetime import datetime
from pydantic import ValidationError
from fastapi import HTTPException
from httpx import AsyncClient
from app.utils.access_token import get_admin_token
from app.utils.helpers import generate_error_response
from app.config import get_settings
from app.utils.access_token import get_auth_request_headers
from app.users.schemas import (
    IBMUserCreateRequest,
    UserLoginRequestData,
    IBMUserCreateResponse,
)
from app.utils.schemas import ResponseModel


logger = logging.getLogger(__name__)


async def create_user(
    core_user_data: IBMUserCreateRequest, global_http_client: AsyncClient
):

    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token)
        settings = get_settings().ibm_verify_config
        signup_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/Users"

        core_user_data_json = core_user_data.model_dump(by_alias=True)
        response = await global_http_client.post(
            signup_url, json=core_user_data_json, headers=headers
        )
        logger.info("Request returned")
        return response

    except HTTPException as he:
        logger.error(f"HTTP Exception in signup: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Signup error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Signup error: {str(e)}")


async def signup_with_password(
    user: UserLoginRequestData, global_http_client: AsyncClient
):
    email = await is_verified_email(user, global_http_client)

    if not email:
        return generate_error_response(400, "Email has not been verified.")

    """Handle user registration through IBM Verify"""
    try:
        # Prepare user data according to SCIM 2.0 schema
        core_user_data = {
            "userName": user.userName,
            "emails": [{"value": user.userName}],
            "password": user.password,
        }
        core_user = IBMUserCreateRequest(**core_user_data)

        start_time = datetime.now()
        response = await create_user(core_user, global_http_client)
        response_json = response.json()
        if response.status_code != 201:
            error_message = response_json.get("detail", "Unknown error")
            logger.error(f"Failed to create user. Response: {error_message}")
            return generate_error_response(response.status_code, error_message)

        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"Signup request completed in {duration:.2f} seconds")

        try:
            validated_data = IBMUserCreateResponse(**response_json)
        except ValidationError as e:
            logger.error(f"Validation Error: {e.json()}")
            print(json.dumps(e.json(), indent=4))
            raise HTTPException(status_code=422, detail="Response validation error")

        return ResponseModel(
            success=True, data=validated_data, message="User created successfully"
        )

    except HTTPException as he:
        logger.error(f"HTTP Exception in signup: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Signup error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Signup error: {str(e)}")


async def is_verified_email(
    user: UserLoginRequestData, global_http_client: AsyncClient
):
    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_settings().ibm_verify_config

        send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications/{user.trxnId}"

        response = await global_http_client.get(send_transient_otp_url, headers=headers)

        if response.json().get("state") == "PENDING":
            logger.error("Email verification is still pending.")
            return False

        elif response.json().get("state") == "TIMEOUT":
            logger.error("Email verification timed out.")
            return False

        elif response.json().get("state") == "CANCELED":
            logger.error("Email verification was canceled.")
            return False

        elif response.json().get("state") == "FAILED":
            logger.error("Email verification has failed.")
            return False

        elif response.status_code != 200:
            logger.error(
                f"Email verification check failed with http status code {response.status_code} from server."
            )
            return False

        else:
            logger.error("Email was verified successfully.")
            return True

    except HTTPException as he:
        logger.error(f"HTTP Exception while checking is_verified_email: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"is_verified_email check error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400, detail=f"is_verified_email error: {str(e)}"
        )
