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

from app.config import get_configuration

logger = logging.getLogger(__name__)


async def _exchange_token_for_session(
    http_client: AsyncClient,
    tenant_url: str,
    access_token: str,
) -> dict:
    """
    Exchange access token for IBM Verify session.

    This establishes a session in IBM Verify using the combined access token,
    which may be necessary for certain IBM Verify operations.

    Args:
        http_client: AsyncClient for making HTTP requests
        tenant_url: IBM Verify tenant URL
        access_token: Access token to exchange for session

    Returns:
        Session response data

    Raises:
        Exception: If session exchange fails
    """
    logger.info("Step 6a: Exchanging access token for IBM Verify session")

    exchange_url = f"{tenant_url}{VerifyAPIEndpoint.EXCHANGE_TOKEN_SESSION.value}"

    session_data = {"access_token": access_token}
    session_headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
    }

    response = await http_client.post(
        exchange_url, data=session_data, headers=session_headers
    )

    logger.info(f"Session exchange response status: {response.status_code}")
    response.raise_for_status()

    # IBM Verify may return 201 Created with empty body
    session_response_data = {}
    if response.content:
        try:
            session_response_data = response.json()
        except Exception as e:
            logger.warning(f"Could not parse session response as JSON: {e}")
            # Session was created successfully (201), just no response body

    logger.info("Successfully exchanged token for IBM Verify session")
    return session_response_data


async def _exchange_fido2_jwt_for_access_token(
    http_client: AsyncClient,
    tenant_url: str,
    fido2_jwt: str,
    client_id: str,
    client_secret: str,
) -> dict:
    """
    Exchange FIDO2 JWT for OAuth access token using jwt-bearer grant.

    This completes the step-up authentication by exchanging the FIDO2 JWT
    for a token with combined authentication methods (password + FIDO2).

    Args:
        http_client: AsyncClient for making HTTP requests
        tenant_url: IBM Verify tenant URL
        fido2_jwt: FIDO2 assertion JWT from authentication
        client_id: STS OAuth client ID
        client_secret: STS OAuth client secret

    Returns:
        Token response with access token that has combined AMR claims

    Raises:
        Exception: If token exchange fails
    """
    logger.info(
        "Step 5: Exchanging FIDO2 JWT for combined access token using jwt-bearer grant"
    )

    client_creds = f"{client_id}:{client_secret}"
    basic_auth = base64.b64encode(client_creds.encode()).decode()

    token_url = f"{tenant_url}{VerifyAPIEndpoint.GET_ACCESS_TOKEN.value}"

    jwt_bearer_data = {
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": fido2_jwt,
    }

    jwt_bearer_headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "Authorization": f"Basic {basic_auth}",
    }

    response = await http_client.post(
        token_url,
        data=jwt_bearer_data,
        headers=jwt_bearer_headers,
    )

    logger.info(f"Token exchange response status: {response.status_code}")
    response.raise_for_status()

    token_data = response.json()
    access_token = token_data.get("access_token")

    if not access_token:
        raise Exception("No access_token in token exchange response")

    logger.info("Successfully exchanged FIDO2 JWT for combined OAuth access token")
    logger.info(f"Token data keys: {token_data.keys()}")
    return token_data


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

        # Check for stepup token from enhanced password verification (steps 1-3)
        stepup_token = request.session.get("stepup_token")

        # Determine which token to use for FIDO2 authentication
        auth_token_for_fido2 = None

        if return_jwt:
            if stepup_token:
                # Step 4: Use stepup token from password verification (steps 1-3)
                logger.info(
                    "Using stepup token from password verification for FIDO2 authentication"
                )
                auth_token_for_fido2 = stepup_token
            else:
                # No stepup token - password verification required first
                logger.error(
                    "No stepup_token in session. Password verification must be performed first "
                    "by calling POST /v1/password/verify/stepup endpoint."
                )
                raise Exception(
                    "Step-up authentication required: Password must be verified before FIDO2 authentication. "
                    "Please call POST /v1/password/verify/stepup first."
                )

        # Build URL with optional returnJwt query parameter
        url = f"{tenant_url}{VerifyAPIEndpoint.FIDO2_RP_BASE.value}/{rp_uuid}/assertion/result"
        if return_jwt:
            url += "?returnJwt=true"
            logger.info("Requesting JWT token in assertion result response")

        # Step 4: Make the FIDO2 authentication request
        # When return_jwt=True, requires stepup token from password verification
        # When return_jwt=False, uses admin token for regular FIDO2 operations
        auth_token = auth_token_for_fido2 if auth_token_for_fido2 else admin_token
        headers = get_auth_request_headers(auth_token, json_content_type=True)

        response = await http_client.post(url, headers=headers, json=body_to_send)
        response.raise_for_status()

        response_data = response.json()
        logger.info("Assertion result submitted successfully")

        # Store FIDO2 JWT in session if requested and perform token exchange
        if return_jwt and "assertion" in response_data:
            fido2_jwt = response_data["assertion"]
            request.session["fido2_auth_jwt"] = fido2_jwt
            logger.info("FIDO2 authentication JWT stored in session for step-up auth")

            # Step 5: Exchange FIDO2 JWT for combined access token
            try:
                settings = get_configuration()

                # Use STS client credentials for jwt-bearer grant (step 5)
                combined_token_data = await _exchange_fido2_jwt_for_access_token(
                    http_client=http_client,
                    tenant_url=tenant_url,
                    fido2_jwt=fido2_jwt,
                    client_id=settings.ibm_verify_config.IBM_VERIFY_STS_CLIENT_ID,
                    client_secret=settings.ibm_verify_config.IBM_VERIFY_STS_SECRET,
                )

                # Step 6: Exchange token for IBM Verify session
                await _exchange_token_for_session(
                    http_client=http_client,
                    tenant_url=tenant_url,
                    access_token=combined_token_data.get("access_token"),
                )

                # Step 6b: Preserve existing userinfo (including sid) before updating session
                from app.constants.session_keys import SessionKeys
                from app.auth.services.auth_user_session import (
                    update_session_tokens,
                    update_session_user_info,
                )

                existing_token = request.session.get(
                    SessionKeys.SESSION_USER_TOKEN.value
                )
                existing_userinfo = (
                    existing_token.get("userinfo") if existing_token else None
                )

                # Step 6c: Update session with new tokens that include FIDO2 in AMR claims
                logger.info("Updating session with FIDO2-authenticated tokens")
                update_session_tokens(request, combined_token_data)

                # Step 6d: Restore userinfo (including sid) to maintain session continuity
                if existing_userinfo:
                    update_session_user_info(request, existing_userinfo)
                    logger.info(
                        "Preserved existing userinfo (including sid) in session"
                    )

                logger.info(
                    f"Session updated with tokens. Expires in: {combined_token_data.get('expires_in')} seconds"
                )

                # Clean up stepup token from session after successful authentication
                if "stepup_token" in request.session:
                    del request.session["stepup_token"]
                if "stepup_grant_id" in request.session:
                    del request.session["stepup_grant_id"]

                logger.info(
                    "Session updated with combined password + FIDO2 authentication tokens"
                )

            except Exception as exchange_error:
                logger.error(
                    f"Error exchanging FIDO2 JWT for combined token: {str(exchange_error)}",
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
