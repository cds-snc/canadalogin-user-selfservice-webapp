"""
Enhanced password verification service for step-up authentication flow.

This implements steps 1-2 of the FIDO2 step-up authentication:
1. Verify password with returnJwt=true using current user's access token
2. Exchange password JWT for OAuth token using jwt-bearer grant
"""

import logging
import base64
import time
from httpx import AsyncClient
from fastapi import Request
from app.utils.schemas import ResponseModel
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.access_token import get_admin_token
from app.password.schemas import UserPassword, VerifiedUserPassword
from app.users.services.get_my_profile import dispatch_get_my_profile_from_ibm
from app.password.services.verify_password import get_cloud_directory_id
from app.constants.verify_endpoints import VerifyAPIEndpoint
from app.config import get_configuration

logger = logging.getLogger(__name__)


async def verify_password_with_jwt(
    http_client: AsyncClient,
    tenant_url: str,
    verify_password_endpoint: str,
    admin_token: str,
    username: str,
    password: str,
) -> tuple[str, str]:
    """
    Step 1: Verify password using admin token with returnJwt=true.

    Note: The returnJwt=true parameter requires elevated permissions,
    so we use an admin token instead of the user's regular access token.

    Args:
        http_client: AsyncClient for making HTTP requests
        tenant_url: IBM Verify tenant URL
        verify_password_endpoint: Password verification endpoint
        admin_token: Admin token with elevated permissions
        username: User's username
        password: User's password

    Returns:
        Tuple of (user_id, password_jwt)

    Raises:
        Exception: If password verification fails
    """
    logger.info("Step 1: Verifying password with returnJwt=true")

    # Get Cloud Directory ID
    cloud_directory_id = await get_cloud_directory_id(
        http_client, verify_password_endpoint
    )

    # Verify password with returnJwt query parameter
    verify_url = f"{verify_password_endpoint}/{cloud_directory_id}?returnJwt=true"

    verify_payload = {
        "username": username,
        "password": password,
    }

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {admin_token}",
    }

    response = await http_client.post(
        verify_url,
        json=verify_payload,
        headers=headers,
    )

    logger.info(f"Password verification response status: {response.status_code}")
    logger.info(f"Password verification response body: {response.text}")
    response.raise_for_status()

    response_data = response.json()
    user_id = response_data.get("id")
    password_jwt = response_data.get("assertion")

    if not user_id:
        raise Exception("No user ID in password verification response")

    if not password_jwt:
        raise Exception("No JWT in password verification response")

    logger.info(f"Password verified successfully for user: {user_id}")
    return user_id, password_jwt


async def exchange_password_jwt_for_token(
    http_client: AsyncClient,
    tenant_url: str,
    password_jwt: str,
    client_id: str,
    client_secret: str,
) -> dict:
    """
    Step 2: Exchange password JWT for OAuth token using jwt-bearer grant.

    Args:
        http_client: AsyncClient for making HTTP requests
        tenant_url: IBM Verify tenant URL
        password_jwt: JWT from password verification
        client_id: STS OAuth client ID
        client_secret: STS OAuth client secret

    Returns:
        Token response with access token

    Raises:
        Exception: If token exchange fails
    """
    logger.info("Step 2: Exchanging password JWT for OAuth token")

    client_creds = f"{client_id}:{client_secret}"
    basic_auth = base64.b64encode(client_creds.encode()).decode()

    token_url = f"{tenant_url}{VerifyAPIEndpoint.GET_ACCESS_TOKEN.value}"

    exchange_data = {
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": password_jwt,
        "scope": "openid",
    }

    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "Authorization": f"Basic {basic_auth}",
    }

    response = await http_client.post(
        token_url,
        data=exchange_data,
        headers=headers,
    )

    logger.info(f"JWT exchange response status: {response.status_code}")
    response.raise_for_status()

    token_data = response.json()
    access_token = token_data.get("access_token")

    if not access_token:
        raise Exception("No access_token in JWT exchange response")

    logger.info("Successfully exchanged password JWT for OAuth token")
    return token_data


async def verify_password_for_stepup(
    request: Request,
    user_access_token: str,
    payload: UserPassword,
) -> ResponseModel:
    """
    Enhanced password verification for FIDO2 step-up authentication.

    Performs steps 1-2:
    1. Verify password with returnJwt=true using admin token (elevated permissions required)
    2. Exchange password JWT for OAuth token using jwt-bearer grant

    Stores the resulting token data in session for use in FIDO2 authentication.

    Args:
        request: FastAPI request object
        user_access_token: User's current access token
        payload: Password to verify

    Returns:
        ResponseModel with verification success and user ID

    Raises:
        HTTPException: For any verification errors
    """
    try:
        logger.info("Starting enhanced password verification for step-up auth")

        http_client: AsyncClient = request.app.state.request_client
        config = get_configuration()

        # Get username from profile
        user_info = await dispatch_get_my_profile_from_ibm(
            http_client, user_access_token
        )
        username = user_info.userName

        # Get admin token for password verification with returnJwt=true
        admin_token = await get_admin_token(http_client)
        logger.info("Retrieved admin token for password verification")

        # Step 1: Verify password with JWT using admin token
        # Note: returnJwt=true requires elevated permissions
        user_id, password_jwt = await verify_password_with_jwt(
            http_client=http_client,
            tenant_url=config.ibm_verify_config.IBM_VERIFY_TENANT_URL,
            verify_password_endpoint=config.verify_password_api_endpoint,
            admin_token=admin_token,
            username=username,
            password=payload.password,
        )

        # Step 2: Exchange password JWT for OAuth token
        stepup_token_data = await exchange_password_jwt_for_token(
            http_client=http_client,
            tenant_url=config.ibm_verify_config.IBM_VERIFY_TENANT_URL,
            password_jwt=password_jwt,
            client_id=config.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID,
            client_secret=config.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_SECRET,
        )

        # Store the complete token data with timestamp for expiry checking
        request.session["stepup_token_data"] = stepup_token_data
        request.session["stepup_token_timestamp"] = time.time()

        return ResponseModel(
            success=True,
            data=VerifiedUserPassword(id=user_id),
            message="Password verified successfully for step-up authentication",
        )

    except Exception as e:
        logger.error(
            f"Error in enhanced password verification: {str(e)}", exc_info=True
        )
        RequestErrorHandler.handle(
            e, context="Password verification for step-up failed"
        )
