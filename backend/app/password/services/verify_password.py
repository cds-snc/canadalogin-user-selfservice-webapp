import logging
from fastapi import HTTPException, Request
from httpx import AsyncClient
from app.utils.access_token import get_admin_token
from app.utils.access_token import get_auth_request_headers
from app.password.schemas import UserPassword, VerifiedUserPassword
from app.utils.schemas import ResponseModel
from app.users.services.get_my_profile import get_user_username
from app.utils.request_error_handler import RequestErrorHandler

logger = logging.getLogger(__name__)

# Documentation to authenticate a user https://docs.verify.ibm.com/verify/docs/first-factor-authentication-password-auth
# https://cds-gcsignin-dev.verify.ibm.com/v1.0/authnmethods/password/login?returnJwt=true


async def dispatch_verify_password(
    request: Request,
    payload: str,
):

    try:
        http_client: AsyncClient = request.app.state.request_client
        access_token = await get_admin_token(http_client)
        headers = get_auth_request_headers(access_token, True)
        verify_password = request.app.state.config.verify_password_api_endpoint
        cloud_directory_id = request.app.state.config.ibm_verify_config.IBM_VERIFY_CLOUD_DIRECTORY_ID_SECRET
        verify_password_api_endpoint = f"{verify_password}/{cloud_directory_id}"
        response = await http_client.post(
            verify_password_api_endpoint, json=payload, headers=headers
        )
        logger.info("Request returned")
        response.raise_for_status()
        logger.info("verified successfully")
        return response

    except Exception as e:
        logger.error("Failed dispatch verify user", exc_info=True)
        if isinstance(e, HTTPException):
            raise
        RequestErrorHandler.handle(e, context="unable to verify")


async def verify_password(
    request: Request, payload: UserPassword, user_access_token: str
):

    try:
        http_client: AsyncClient = request.app.state.request_client
        user_name = await get_user_username(http_client, user_access_token)
        user_data = {
            "username": user_name,
            "password": payload.password,
        }

        response = await dispatch_verify_password(request, user_data)
        response_json = response.json()
        user_id = response_json.get("id")

        return ResponseModel(
            success=True, data=VerifiedUserPassword(id=user_id), message="Successfully verified user"
        )
    except Exception as e:
        logger.error("Failed dispatch verify user", exc_info=True)
        if isinstance(e, HTTPException):
            raise
        RequestErrorHandler.handle(e, context="unable to verify ")
