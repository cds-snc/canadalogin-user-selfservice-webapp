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

from app.auth.services.auth_user_session import introspect_user_token
from app.config import get_configuration

logger = logging.getLogger(__name__)


async def _perform_mfa_token_exchange(
    http_client: AsyncClient,
    tenant_url: str,
    user_access_token: str,
    client_id: str,
    client_secret: str,
) -> dict:
    """
    [DEPRECATED - NOT USABLE] Token exchange for MFA challenge token.

    This function is kept for reference but cannot be used due to IBM Verify restriction:
    "CSIAQ5207E Clients are not allowed to perform a token exchange on their own tokens."

    The proper flow requires password verification first (POST /v1/password/verify/stepup)
    which performs the correct token exchange sequence and stores stepup_token in session.

    Uses RFC 8693 token exchange with the user's access token as subject_token
    to obtain an MFA challenge token with:
    - scope: "mfa_challenge"
    - allowedFactors: ["fido2"]

    Args:
        http_client: AsyncClient for making HTTP requests
        tenant_url: IBM Verify tenant URL
        user_access_token: User's current access token
        client_id: STS OAuth client ID
        client_secret: STS OAuth client secret

    Returns:
        Token response with MFA challenge token

    Raises:
        Exception: If token exchange fails
    """
    logger.info("Step 1: Performing token exchange for MFA challenge")

    client_creds = f"{client_id}:{client_secret}"
    basic_auth = base64.b64encode(client_creds.encode()).decode()

    token_url = f"{tenant_url}{VerifyAPIEndpoint.GET_ACCESS_TOKEN.value}"

    exchange_data = {
        "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
        "client_id": client_id,
        "client_secret": client_secret,
        "subject_token": user_access_token,
        "subject_token_type": "urn:ietf:params:oauth:token-type:access_token",
        "scope": "openid 2fa_required_scope",
    }

    exchange_headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "Authorization": f"Basic {basic_auth}",
    }

    response = await http_client.post(
        token_url,
        data=exchange_data,
        headers=exchange_headers,
    )

    logger.info(f"Token exchange response status: {response.status_code}")
    logger.info(f"Token exchange response body: {response.text}")
    response.raise_for_status()

    token_data = response.json()

    # Verify we got an MFA challenge token
    scope = token_data.get("scope", "")
    allowed_factors = token_data.get("allowedFactors", [])

    logger.info(f"Token scope: {scope}, allowedFactors: {allowed_factors}")

    if "mfa_challenge" not in scope:
        logger.warning(f"Expected 'mfa_challenge' scope, got: {scope}")

    if "fido2" not in allowed_factors:
        logger.warning(f"Expected 'fido2' in allowedFactors, got: {allowed_factors}")

    logger.info("Successfully obtained MFA challenge token")
    return token_data


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
    logger.info(f"Token exchange response body: {response.text}")
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
                from app.auth.services.auth_user_session import update_session_tokens

                settings = get_configuration()

                # Use STS client credentials for jwt-bearer grant (step 5)
                combined_token_data = await _exchange_fido2_jwt_for_access_token(
                    http_client=http_client,
                    tenant_url=tenant_url,
                    fido2_jwt=fido2_jwt,
                    client_id=settings.ibm_verify_config.IBM_VERIFY_STS_CLIENT_ID,
                    client_secret=settings.ibm_verify_config.IBM_VERIFY_STS_SECRET,
                )

                # Step 6: Update session with the new combined tokens
                await introspect_user_token(
                    http_client, combined_token_data.get("access_token")
                )
                update_session_tokens(request, combined_token_data)

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
