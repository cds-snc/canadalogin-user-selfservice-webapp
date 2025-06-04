import logging
from datetime import datetime
from fastapi import HTTPException
from httpx import AsyncClient
from app.utils.access_token import get_admin_token
from app.utils.helpers import generate_error_response
from app.config import get_settings
from app.utils.access_token import get_auth_request_headers
from app.users.schemas import UserLoginRequestData, IBMUsernamePasswordAuthRequestData
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)

# Documentation to authenticate a user https://docs.verify.ibm.com/verify/docs/first-factor-authentication-password-auth
# https://cds-gcsignin-dev.verify.ibm.com/v1.0/authnmethods/password/login?returnJwt=true


async def requestCloudDirectoryId(global_http_client: AsyncClient):
    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_settings().ibm_verify_config
        signin_url = f"{settings.IBM_VERIFY_TENANT_URL}/v1.0/authnmethods/password?search=name%20%3D%20%22Cloud%20Directory%22"

        response = await global_http_client.get(signin_url, headers=headers)
        logger.info("Request returned")
        return response

    except HTTPException as he:
        logger.error(f"HTTP Exception in signup: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Signup error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Signup error: {str(e)}")


async def getCloudDirectoryId(global_http_client: AsyncClient):
    try:

        response = await requestCloudDirectoryId(global_http_client)
        response_json = response.json()
        cloud_directory_id = response_json.get("password")[0].get("id")

        if response.status_code != 200:
            error_message = response_json.get("detail", "Unknown error")
            if response.status_code == 400:
                return generate_error_response(response.status_code, error_message)

            if cloud_directory_id is None:
                error_message = response_json.get("detail", "Unknown error")
                logger.error(error_message)
                return generate_error_response(400, error_message)
        return cloud_directory_id

    except HTTPException as he:
        logger.error(f"HTTP Exception in signup: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Signup error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Signup error: {str(e)}")


async def signin_with_username_password(
    username_password: IBMUsernamePasswordAuthRequestData,
    global_http_client: AsyncClient,
):

    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_settings().ibm_verify_config
        cloud_directory_id = await getCloudDirectoryId(global_http_client)
        signin_url = f"{settings.IBM_VERIFY_TENANT_URL}/v1.0/authnmethods/password/{cloud_directory_id}?returnJwt=true"

        core_user_data_dict = username_password.model_dump()

        print(core_user_data_dict)

        response = await global_http_client.post(
            signin_url, json=core_user_data_dict, headers=headers
        )
        logger.info("Request returned")
        return response

    except HTTPException as he:
        logger.error(f"HTTP Exception in signup: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Signup error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Signup error: {str(e)}")


# await global_http_client.get


async def signin_with_password(
    user: UserLoginRequestData, global_http_client: AsyncClient
):

    try:

        user_data = {
            "username": user.userName,
            "password": user.password,
        }
        username_password = IBMUsernamePasswordAuthRequestData(**user_data)

        start_time = datetime.now()
        response = await signin_with_username_password(
            username_password, global_http_client
        )
        response_json = response.json()
        user_id = response_json.get("id")
        assertion = response_json.get("assertion")

        if response.status_code != 200:
            error_message = response_json.get("detail", "Unknown error")
            if response.status_code == 400:
                error_message = response_json.get("messageDescription", "Unknown error")
            return generate_error_response(response.status_code, error_message)

        if user_id is None:
            error_message = response_json.get("detail", "Unknown error")
            logger.error(error_message)
            return generate_error_response(400, error_message)

        if assertion is None:
            error_message = response_json.get("detail", "Unknown error")
            logger.error(error_message)
            return generate_error_response(400, error_message)

        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"Signup request completed in {duration:.2f} seconds")
        success_data = {"id": user_id, "assertion": assertion}
        return ResponseModel(
            success=True, data=success_data, message="Successfully signed in"
        )
    except HTTPException as he:
        logger.error(f"HTTP Exception in signup: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Signup error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Signup error: {str(e)}")
