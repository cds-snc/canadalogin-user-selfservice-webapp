import logging
import json
from datetime import datetime
from pydantic import ValidationError
from fastapi import HTTPException
from httpx import AsyncClient
from app.utils.access_token import get_access_token
from app.utils.helpers import generate_error_response
from app.config import get_settings
from app.utils.access_token import get_auth_request_headers
from app.users.schemas import IBMUserCreateRequest, UserLoginRequestData, IBMUserCreateResponse
from app.utils.schemas import ResponseModel


logger = logging.getLogger(__name__)


async def create_user(core_user_data: IBMUserCreateRequest):

    try:
        access_token = await get_access_token()
        headers = get_auth_request_headers(access_token)
        settings = get_settings().ibm_verify_config
        signup_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/Users"

        core_user_data_json = core_user_data.model_dump(
            by_alias=True)
        async with AsyncClient() as client:
            response = await client.post(signup_url, json=core_user_data_json, headers=headers)
            logger.info("Request returned")
            return response

    except HTTPException as he:
        logger.error(f"HTTP Exception in signup: {str(he)}")
        raise he
    except Exception as e:
        logger.error(
            f"Signup error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400, detail=f"Signup error: {str(e)}")


async def signup_with_password(user: UserLoginRequestData):
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
        response = await create_user(core_user)
        response_json = response.json()
        if response.status_code != 201:
            error_message = response_json.get('detail', 'Unknown error')
            logger.error(
                f"Failed to create user. Response: {error_message}")
            return generate_error_response(response.status_code, error_message)

        duration = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"Signup request completed in {duration:.2f} seconds")

        try:
            validated_data = IBMUserCreateResponse(**response_json)
        except ValidationError as e:
            logger.error(f"Validation Error: {e.json()}")
            print(json.dumps(e.json(), indent=4))
            raise HTTPException(
                status_code=422, detail="Response validation error")

        return ResponseModel(
            success=True,
            data=validated_data,
            message="User created successfully")

    except HTTPException as he:
        logger.error(f"HTTP Exception in signup: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Signup error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400, detail=f"Signup error: {str(e)}")
