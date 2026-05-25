import logging
from typing import Dict

from fastapi import HTTPException, status, Request
from httpx import AsyncClient, HTTPStatusError, Response

from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.password.schemas import (
    UserPassword,
    VerifiedUserPassword,
    IBMIdentitySourceResponse,
)
from app.utils.schemas import ResponseModel
from app.users.services.get_my_profile import dispatch_get_my_profile_from_ibm
from urllib.parse import quote

logger = logging.getLogger(__name__)


async def dispatch_get_cloud_directory_Id(
    global_http_client: AsyncClient, verify_password_endpoint: str
) -> Response:
    """
    The Cloud Directory ID is required to verify user password against IBM Verify.

    Documentation: https://docs.verify.ibm.com/verify/reference/getpasswordmethods

    Args:
        http_client: Async HTTP client
        verify_password_endpoint: Base URL for password verification API

    Returns:
        Response: Cloud Directory ID

    Raises:
        HTTPException: Via RequestErrorHandler for any request failures
    """
    access_token = await get_admin_token(global_http_client)
    headers = get_auth_request_headers(access_token, True)
    cloud_directory_name = "Cloud Directory"
    search_value = f'name="{cloud_directory_name}"'
    encoded_search = quote(search_value, safe="")

    search_identity_source_endpoint = (
        f"{verify_password_endpoint}?search={encoded_search}"
    )
    response = await global_http_client.get(
        search_identity_source_endpoint, headers=headers
    )

    logger.info("Request returned")
    response.raise_for_status()
    logger.info("successfully retrieved dispatch_get_cloud_directory_Id")
    return response


async def get_cloud_directory_id(
    global_http_client: AsyncClient, verify_password_endpoint: str
) -> str:
    """
    The Cloud Directory ID is required to verify user password against IBM Verify.

    Documentation: https://docs.verify.ibm.com/verify/reference/getpasswordmethods

    Args:
        http_client: Async HTTP client
        verify_password_endpoint: Base URL for password verification API

    Returns:
        Response: Cloud Directory ID

    Raises:
        HTTPException: Via RequestErrorHandler for any request failures
    """
    response = await dispatch_get_cloud_directory_Id(
        global_http_client, verify_password_endpoint
    )
    response_json = response.json()
    data_validation = IBMIdentitySourceResponse(**response_json)

    if not data_validation.password or len(data_validation.password) == 0:
        logger.error("Cloud Directory ID not found in IBM Verify response")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bad Request")

    cloud_directory_id = data_validation.password[0].id

    if not cloud_directory_id:
        logger.error("Cloud Directory ID not found in IBM Verify response")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bad Request")

    return cloud_directory_id


async def dispatch_verify_password(
    http_client: AsyncClient,
    verify_password_endpoint: str,
    payload: Dict[str, str],
) -> Response:
    """
    Dispatch password verification request to IBM Verify API.

    Documentation: https://docs.verify.ibm.com/verify/reference/authenticatewithpassword

    Args:
        http_client: Async HTTP client
        verify_password_endpoint: Base URL for password verification API
        payload: Dict containing username and password

    Returns:
        Response: HTTP response from IBM Verify API

    Raises:
        HTTPException: Via RequestErrorHandler for any request failures
    """
    logger.info("Verifying user with IBM Verify")

    access_token = await get_admin_token(http_client)
    headers = get_auth_request_headers(access_token, True)
    cloud_directory_id = await get_cloud_directory_id(
        http_client, verify_password_endpoint
    )
    ibm_verify_password_api_endpoint = (
        f"{verify_password_endpoint}/{cloud_directory_id}"
    )

    try:
        response = await http_client.post(
            ibm_verify_password_api_endpoint, json=payload, headers=headers
        )
        response.raise_for_status()
    except HTTPStatusError as e:
        if e.response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_401_UNAUTHORIZED,
        ]:
            try:
                body = e.response.json()
                message_id = body.get("messageId")
                if message_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=message_id,
                    )
            except (ValueError, AttributeError):
                pass
        raise

    logger.info("Verified successfully with IBM Verify")
    return response


async def verify_user_password(
    request: Request,
    user_access_token: str,
    payload: UserPassword,
) -> ResponseModel:
    """
    Verify user against IBM Verify.

    Retrieves the user's username from the session and verify
    the provided password.

    Args:
        request: FastAPI request object containing app state
        payload: Only user password

    Returns:
        VerifiedUserPassword: Success response with user ID

    Raises:
        HTTPException: For authentication or verification errors
    """
    logger.info("Starting verification for user")

    http_client: AsyncClient = request.app.state.request_client
    config = request.app.state.config

    # Retrieve unmasked username from the profile
    user_info_from_profile = await dispatch_get_my_profile_from_ibm(
        http_client, user_access_token
    )
    profile_username = user_info_from_profile.userName

    # Prepare verification payload
    verification_data = {
        "username": profile_username,
        "password": payload.password,
    }

    # Verify password with IBM Verify
    response = await dispatch_verify_password(
        http_client=http_client,
        verify_password_endpoint=config.verify_password_api_endpoint,
        payload=verification_data,
    )

    response_json = response.json()
    user_id = response_json.get("id")

    if not user_id:
        logger.error("IBM Verify response missing user ID")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bad Request")

    logger.info(f"User verified successfully: {user_id}")

    return ResponseModel(
        success=True,
        data=VerifiedUserPassword(id=user_id),
        message="User verified successfully",
    )
