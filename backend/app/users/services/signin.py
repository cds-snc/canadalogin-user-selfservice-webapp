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
from app.users.schemas import BasicUserAuthRequiredData, IBMAuthenticateUserBasic
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def signin_with_username_password(username_password: IBMAuthenticateUserBasic):

    try:
        access_token = await get_access_token()
        headers = get_auth_request_headers(access_token)
        settings = get_settings().ibm_verify_config
        signin_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/Users/authentication"

        core_user_data_dict = username_password.model_dump()

        async with AsyncClient() as client:
            print(core_user_data_dict)

            response = await client.post(signin_url, json=core_user_data_dict, headers=headers)
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


async def basic_signin(user: BasicUserAuthRequiredData):

    try:

        # Prepare user data according to SCIM 2.0 schema
        user_data = {
            "userName": user.email,
            "password": user.password,
        }
        username_password = IBMAuthenticateUserBasic(**user_data)

        # print(json.dumps(verify_user_data, indent=4))
        start_time = datetime.now()
        response = await signin_with_username_password(username_password)
        response_json = response.json()
        user_id = response_json.get("id")

        if response.status_code != 200:
            error_message = response_json.get('detail', 'Unknown error')
            if response.status_code == 400:
                return generate_error_response(response.status_code, error_message)

            if user_id is None:
                error_message = response_json.get('detail', 'Unknown error')
                logger.error(error_message)
                return generate_error_response(400, error_message)

        duration = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"Signup request completed in {duration:.2f} seconds")
        success_data = {"id": user_id}
        return ResponseModel(
            success=True,
            data=success_data,
            message="Successfully signed in")
    except HTTPException as he:
        logger.error(f"HTTP Exception in signup: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Signup error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Signup error: {str(e)}")
