import logging
import json
from datetime import datetime
from pydantic import ValidationError
from fastapi import HTTPException, Response
from httpx import AsyncClient

from app.users.services.otp_verified_check import otp_method_is_verified
from app.utils.access_token import get_admin_token
from app.utils.helpers import generate_error_response
from app.config import get_settings
from app.utils.access_token import get_auth_request_headers
from app.users.schemas import (
    IBMUserCreateRequest,
    IBMUserCreateResponse,
    NewUserCreationData,
)
from app.utils.schemas import ResponseModel
from app.users.services.login import signin_with_password


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


def set_secure_cookie(response: Response, access_token: str):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production
        samesite="Lax",  # or "Lax" if needed
        path="/"
    )


async def signup_with_password(
    user: NewUserCreationData, global_http_client: AsyncClient, response: Response
):
    email = await otp_method_is_verified(global_http_client, user)

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
        create_user_response = await create_user(core_user, global_http_client)
        create_user_response_json = create_user_response.json()
        if create_user_response.status_code != 201:
            error_message = create_user_response_json.get("detail", "Unknown error")
            logger.error(f"Failed to create user. Response: {error_message}")
            return generate_error_response(create_user_response.status_code, error_message)

        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"Signup request completed in {duration:.2f} seconds")

        try:
            login_user = UserLoginRequestData(
                userName=user.userName, password=user.password
            )
            signin_user_response = await signin_with_password(login_user, global_http_client)
            signin_user_response_json = signin_user_response

        except Exception as log_error:
            logger.error(f"Error logging user creation: {str(log_error)}")

        try:
            access_token = signin_user_response_json.data.get("assertion")
            authenticated_user = {
                "userName": create_user_response_json.get("userName"),
                "id": create_user_response_json.get("id"),
            }
            set_secure_cookie(response, access_token)
            validated_data = IBMUserCreateResponse(**authenticated_user)
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
