import logging
from pydantic import ValidationError
from fastapi import HTTPException
from httpx import AsyncClient
from app.utils.access_token import get_admin_token
from app.config import get_configuration
from app.utils.access_token import get_auth_request_headers
from app.password.schemas import IBMVerifyPasswordPolicy
from app.utils.schemas import ResponseModel
from app.utils.request_error_handler import RequestErrorHandler


logger = logging.getLogger(__name__)


async def dispatch_get_password_policy(global_http_client: AsyncClient):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        access_token = await get_admin_token(global_http_client)
        if not access_token:
            logger.error("Failed to get access token")
            raise HTTPException(status_code=500, detail="Failed to get access token")
        headers = get_auth_request_headers(access_token)

        settings = get_configuration()
        password_policy_url = settings.password_policy_api_endpoint
        logger.info("Retrieve Password Policy URL")
        response = await global_http_client.get(password_policy_url, headers=headers)

        logger.info(f"returned response from password policy: {response.json()}")

        response.raise_for_status()
        logger.info("password policy returned successfully")
        return response

    except Exception as e:
        logger.error(f"Error password policy: {str(e)}", exc_info=True)
        await RequestErrorHandler.handle(e, context="password policy")


async def get_password_policy(global_http_client: AsyncClient):
    """Get password policy from IBM Verify API"""
    try:

        password_policy_response = await dispatch_get_password_policy(
            global_http_client
        )

        logger.info("password_policy_response returned successfully")
        response_json = password_policy_response.json()

        try:
            validated_data = IBMVerifyPasswordPolicy(**response_json)
        except ValidationError as validation_error:
            logger.warning("Invalid API response schema: %s", validation_error.errors())
            raise HTTPException(status_code=422, detail="Invalid API response schema")

        return ResponseModel(
            success=True,
            data=validated_data,
            message="Password policy retrieved successfully",
        )

    except Exception as e:
        logger.error(f"Error dispatch_reset_otp: {str(e)}", exc_info=True)
        await RequestErrorHandler.handle(e, context="Second Step Password Update")
