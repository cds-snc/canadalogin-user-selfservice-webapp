import logging
from typing import Dict

from fastapi import HTTPException, Request
from httpx import AsyncClient, Response

from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.password.schemas import UserPassword, VerifiedUserPassword
from app.utils.schemas import ResponseModel
from app.utils.request_error_handler import RequestErrorHandler
from app.auth.services.auth_user_session import get_user_info

logger = logging.getLogger(__name__)


async def dispatch_verify_password(
    http_client: AsyncClient,
    verify_password_endpoint: str,
    cloud_directory_id: str,
    payload: Dict[str, str],
) -> Response:
    """
    Dispatch password verification request to IBM Verify API.

    Documentation: https://docs.verify.ibm.com/verify/docs/first-factor-authentication-password-auth

    Args:
        http_client: Async HTTP client
        verify_password_endpoint: Base URL for password verification API
        cloud_directory_id: IBM Verify Cloud Directory ID
        payload: Dict containing username and password

    Returns:
        Response: HTTP response from IBM Verify API

    Raises:
        HTTPException: Via RequestErrorHandler for any request failures
    """
    try:
        logger.info("Verifying user with IBM Verify")

        access_token = await get_admin_token(http_client)
        headers = get_auth_request_headers(access_token, True)

        ibm_verify_password_api_endpoint = f"{verify_password_endpoint}/{cloud_directory_id}"

        response = await http_client.post(
            ibm_verify_password_api_endpoint,
            json=payload,
            headers=headers
        )
        response.raise_for_status()

        logger.info("Verified successfully with IBM Verify")
        return response

    except Exception as e:
        logger.error(f"Failed to verify with IBM Verify: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e, context="User verification failed")


async def verify_user_password(
    request: Request,
    payload: UserPassword,
) -> ResponseModel:
    """
    Verify user against IBM Verify.

    Retrieves the user's username from the session and verify
    the provided password.

    Args:
        request: FastAPI request object containing app state
        payload: User password

    Returns:
        VerifiedUserPassword: Success response with user ID

    Raises:
        HTTPException: For authentication or verification errors
    """
    try:
        logger.info("Starting verification for user")

        http_client: AsyncClient = request.app.state.request_client
        config = request.app.state.config

        # Get username from the session
        user_info_from_session = await get_user_info(request)
        session_username = user_info_from_session.get("preferred_username")
        # Prepare verification payload
        verification_data = {
            "username": session_username,
            "password": payload.password,
        }

        # Verify password with IBM Verify
        response = await dispatch_verify_password(
            http_client=http_client,
            verify_password_endpoint=config.verify_password_api_endpoint,
            cloud_directory_id=config.ibm_verify_config.IBM_VERIFY_CLOUD_DIRECTORY_ID_SECRET,
            payload=verification_data,
        )

        response_json = response.json()
        user_id = response_json.get("id")

        if not user_id:
            logger.error("IBM Verify response missing user ID")
            raise HTTPException(
                status_code=422,
                detail="Invalid response from verification service"
            )

        logger.info(f"User verified successfully: {user_id}")

        return ResponseModel(
            success=True,
            data=VerifiedUserPassword(id=user_id),
            message="User verified successfully"
        )

    except Exception as e:
        logger.error(f"Unexpected error during user verification: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e, context="User verification failed")
