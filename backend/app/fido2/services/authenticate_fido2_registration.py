"""
Service for authenticating with FIDO2 passkeys
"""

import logging
from httpx import AsyncClient
from fastapi import Request
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel
from app.constants.verify_endpoints import VerifyAPIEndpoint
from app.fido2.services.helper_utils import (
    get_tenant_url,
    get_rp_id,
    get_rp_uuid_from_rp_id,
    get_user_profile_info,
)
from app.fido2.schemas import AssertionOptionsRequest, FIDO2AssertionResultRequest
import base64

from app.auth.services.auth_user_session import (
    introspect_user_token,
)

logger = logging.getLogger(__name__)


async def get_assertion_options(
    http_client: AsyncClient,
    user_access_token: str,
    request_data: AssertionOptionsRequest,
) -> ResponseModel:
    """
    Get FIDO2 assertion options for starting passkey authentication.
    Automatically injects user profile information.

    Args:
        http_client: AsyncClient for making HTTP requests
        user_access_token: User's authentication token
        request_data: AssertionOptionsRequest containing optional parameters

    Returns:
        ResponseModel with assertion options data
    """

    # Set proper defaults for FIDO2 assertion
    request_body = {
        "userVerification": "preferred",
    }

    try:
        tenant_url = get_tenant_url()
        rp_id = get_rp_id()

        # Get admin token for RP operations
        admin_token = await get_admin_token(http_client)
        rp_uuid = await get_rp_uuid_from_rp_id(http_client, admin_token, rp_id)

        # Get user profile information
        username, display_name, user_id = await get_user_profile_info(
            http_client, user_access_token
        )

        # Prepare request body with user info
        body_to_send = request_body.copy()
        body_to_send["userId"] = user_id

        logger.info(f"Assertion options - username: {username}, userId: {user_id}")

        # Make the request
        url = f"{tenant_url}{VerifyAPIEndpoint.FIDO2_RP_BASE.value}/{rp_uuid}/assertion/options"
        headers = get_auth_request_headers(admin_token, json_content_type=True)

        response = await http_client.post(url, headers=headers, json=body_to_send)
        logger.info(f"Assertion options response status: {response.status_code}")
        response.raise_for_status()

        response_data = response.json()
        return ResponseModel(
            success=True,
            data=response_data,
            message="Assertion options retrieved successfully",
        )

    except Exception as e:
        logger.error(f"Error getting assertion options: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)


async def submit_assertion_result(
    request: Request,
    http_client: AsyncClient,
    user_access_token: str,
    request_body: FIDO2AssertionResultRequest,
    return_jwt: bool = False,
) -> ResponseModel:
    """
    Submit FIDO2 assertion result to complete passkey authentication.

    Args:
        request: FastAPI Request object for session access
        http_client: AsyncClient for making HTTP requests
        user_access_token: User's authentication token
        request_body: Assertion result data from the client
        return_jwt: If True, IBM Verify will return a JWT token in the response
                   that can be used for session establishment or step-up auth

    Returns:
        ResponseModel with authentication result (and JWT if return_jwt=True)
    """
    try:
        tenant_url = get_tenant_url()
        rp_id = get_rp_id()

        # Get admin token for RP operations
        admin_token = await get_admin_token(http_client)
        rp_uuid = await get_rp_uuid_from_rp_id(http_client, admin_token, rp_id)

        # Prepare request body
        body_to_send = request_body.model_dump(exclude_none=True)

        # Build URL with optional returnJwt query parameter
        url = f"{tenant_url}{VerifyAPIEndpoint.FIDO2_RP_BASE.value}/{rp_uuid}/assertion/result"
        if return_jwt:
            url += "?returnJwt=true"
            logger.info("Requesting JWT token in assertion result response")

        # Make the request
        headers = get_auth_request_headers(admin_token, json_content_type=True)

        response = await http_client.post(url, headers=headers, json=body_to_send)
        response.raise_for_status()

        response_data = response.json()
        logger.info("Assertion result submitted successfully")

        # Store FIDO2 JWT in session if requested (useful for step-up authentication)
        if return_jwt and "assertion" in response_data:
            fido2_jwt = response_data["assertion"]
            request.session["fido2_auth_jwt"] = fido2_jwt
            logger.info("FIDO2 authentication JWT stored in session for step-up auth")

            # Exchange the FIDO2 JWT for OAuth access token, then update session
            try:
                logger.info("Step 1: Exchanging FIDO2 JWT for OAuth access token")

                # Get configuration for client credentials
                from app.config import get_configuration

                settings = get_configuration()

                # Step 1: Token exchange to get OAuth access token from FIDO2 JWT

                client_creds = f"{settings.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID}:{settings.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_SECRET}"
                basic_auth = base64.b64encode(client_creds.encode()).decode()

                token_exchange_url = (
                    f"{tenant_url}{VerifyAPIEndpoint.GET_ACCESS_TOKEN.value}"
                )

                token_exchange_data = {
                    "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
                    "subject_token": fido2_jwt,
                    "subject_token_type": "urn:gc:token-type:fido2",
                    "requested_token_type": "urn:ietf:params:oauth:token-type:access_token",
                }

                token_exchange_headers = {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                    "Authorization": f"Basic {basic_auth}",
                }

                token_response = await http_client.post(
                    token_exchange_url,
                    data=token_exchange_data,
                    headers=token_exchange_headers,
                )

                logger.info(
                    f"Token exchange response status: {token_response.status_code}"
                )
                logger.info(f"Token exchange response body: {token_response.text}")
                token_response.raise_for_status()

                token_data = token_response.json()
                oauth_access_token = token_data.get("access_token")

                await introspect_user_token(http_client, oauth_access_token)
                # update_session_tokens(request, token_data)

                if not oauth_access_token:
                    raise Exception("No access_token in token exchange response")

                logger.info("Successfully exchanged FIDO2 JWT for OAuth access token")

                # Step 2: Use the OAuth access token to establish session
                logger.info("Step 2: Using OAuth access token to establish session")
                exchange_url = (
                    f"{tenant_url}{VerifyAPIEndpoint.EXCHANGE_TOKEN_SESSION.value}"
                )

                session_data = {"access_token": oauth_access_token}
                session_headers = {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                }

                session_response = await http_client.post(
                    exchange_url, data=session_data, headers=session_headers
                )

                logger.info(f"Session response status: {session_response.status_code}")
                session_response.raise_for_status()

                # Update session with new tokens that include FIDO2 in AMR claims
                logger.info("Session updated with FIDO2-authenticated tokens")

            except Exception as exchange_error:
                logger.error(
                    f"Error in token exchange process: {str(exchange_error)}",
                    exc_info=True,
                )
                # Don't fail the whole request if token exchange fails
                # The assertion was successful, just log the error

        return ResponseModel(
            success=True,
            data=response_data,
            message="FIDO2 authentication completed successfully",
        )

    except Exception as e:
        logger.error(f"Error submitting assertion result: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)
