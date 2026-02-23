"""
Service for authenticating with FIDO2 passkeys
"""

import logging
import time
from httpx import AsyncClient
from fastapi import Request
from starsessions import get_session_handler
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


def _is_token_expired(token_data: dict, token_timestamp: float) -> bool:
    """
    Check if a token has expired based on expires_in field and timestamp.

    Args:
        token_data: Token data dict containing expires_in field
        token_timestamp: Unix timestamp when token was obtained

    Returns:
        True if token is expired, False otherwise
    """
    if not token_data or not token_timestamp:
        return True

    expires_in = token_data.get("expires_in", 0)
    if expires_in <= 0:
        return True

    current_time = time.time()
    elapsed_time = current_time - token_timestamp

    # Add 30 second buffer to account for clock skew and processing time
    is_expired = elapsed_time >= (expires_in - 30)

    if is_expired:
        logger.warning(
            f"Token expired: elapsed {elapsed_time:.0f}s >= expires_in {expires_in}s"
        )

    return is_expired


async def _perform_mfa_refresh_token_flow(
    http_client: AsyncClient,
    tenant_url: str,
    refresh_token: str,
    client_id: str,
    client_secret: str,
) -> dict:
    """
    Step 3: Perform refresh token flow to get MFA challenge token.

    This triggers the MFA policy and returns a token with:
    - scope: "mfa_challenge"
    - allowedFactors: ["fido2"]

    Args:
        http_client: AsyncClient for making HTTP requests
        tenant_url: IBM Verify tenant URL
        refresh_token: Refresh token from password verification
        client_id: OAuth client ID
        client_secret: OAuth client secret

    Returns:
        Token response with MFA challenge token

    Raises:
        Exception: If refresh token flow fails
    """
    logger.info("Step 3: Performing refresh token flow for MFA challenge")

    client_creds = f"{client_id}:{client_secret}"
    basic_auth = base64.b64encode(client_creds.encode()).decode()

    token_url = f"{tenant_url}{VerifyAPIEndpoint.GET_ACCESS_TOKEN.value}"

    refresh_data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    }

    refresh_headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "Authorization": f"Basic {basic_auth}",
    }

    response = await http_client.post(
        token_url,
        data=refresh_data,
        headers=refresh_headers,
    )

    logger.info(f"Refresh token flow response status: {response.status_code}")
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
                   that can be used for step-up auth with combined AMR claims

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

        # Check for stepup token data from password verification (steps 1-2)
        stepup_token_data = request.session.get("stepup_token_data")
        stepup_token_timestamp = request.session.get("stepup_token_timestamp")
        mfa_challenge_token = None

        if return_jwt:
            if not stepup_token_data:
                # No stepup tokens - password verification required first
                logger.error(
                    "No stepup_token_data in session. Password verification must be performed first "
                    "by calling POST /v1/password/verify/stepup endpoint."
                )
                raise Exception(
                    "Step-up authentication required: Password must be verified before FIDO2 authentication. "
                    "Please call POST /v1/password/verify/stepup first."
                )

            # Check if stepup token has expired
            if _is_token_expired(stepup_token_data, stepup_token_timestamp):
                logger.error(
                    "Step-up token has expired. Password verification must be performed again."
                )
                raise Exception(
                    "Step-up token expired: Please call POST /v1/password/verify/stepup again."
                )

            # Step 3: Perform MFA refresh token flow to get MFA challenge token
            try:
                settings = get_configuration()

                logger.info("Starting MFA refresh token flow for FIDO2 authentication")

                stepup_refresh_token = stepup_token_data.get("refresh_token")
                if not stepup_refresh_token:
                    raise Exception("No refresh_token in stepup token data")

                mfa_token_data = await _perform_mfa_refresh_token_flow(
                    http_client=http_client,
                    tenant_url=tenant_url,
                    refresh_token=stepup_refresh_token,
                    client_id=settings.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID,
                    client_secret=settings.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_SECRET,
                )

                mfa_challenge_token = mfa_token_data.get("access_token")
                logger.info("Using MFA challenge token for FIDO2 authentication")

            except Exception as mfa_error:
                logger.error(
                    f"Error getting MFA challenge token: {str(mfa_error)}",
                    exc_info=True,
                )
                raise Exception(f"MFA refresh token flow failed: {str(mfa_error)}")

        # Determine which token to use for FIDO2 authentication
        auth_token_for_fido2 = (
            mfa_challenge_token if mfa_challenge_token else admin_token
        )

        # Build URL with optional returnJwt query parameter
        url = f"{tenant_url}{VerifyAPIEndpoint.FIDO2_RP_BASE.value}/{rp_uuid}/assertion/result"
        if return_jwt:
            url += "?returnJwt=true"
            logger.info("Requesting JWT token in assertion result response")

        # Step 4: Make the FIDO2 authentication request
        # Use MFA challenge token if available, otherwise use admin token
        headers = get_auth_request_headers(auth_token_for_fido2, json_content_type=True)

        http_response = await http_client.post(url, headers=headers, json=body_to_send)
        http_response.raise_for_status()

        response_data = http_response.json()
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

                # Use Profile Management client credentials for jwt-bearer grant (step 5)
                combined_token_data = await _exchange_fido2_jwt_for_access_token(
                    http_client=http_client,
                    tenant_url=tenant_url,
                    fido2_jwt=fido2_jwt,
                    client_id=settings.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID,
                    client_secret=settings.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_SECRET,
                )

                id_token = combined_token_data.get("id_token")
                payload_json = None

                # Decode the JWT id_token to inspect its contents
                if id_token:
                    import json

                    # JWT format: header.payload.signature (each part is base64url encoded)
                    parts = id_token.split(".")
                    if len(parts) == 3:
                        # Decode the payload (middle part)
                        # Add padding if needed for base64 decoding
                        payload_b64 = parts[1]
                        padding = 4 - (len(payload_b64) % 4)
                        if padding != 4:
                            payload_b64 += "=" * padding

                        try:
                            payload_bytes = base64.b64decode(payload_b64)
                            payload_json = json.loads(payload_bytes)
                            logger.info(
                                f"Decoded id_token payload: {json.dumps(payload_json, indent=2)}"
                            )
                            logger.info(f"id_token sid: {payload_json.get('sid')}")
                            logger.info(f"id_token amr: {payload_json.get('amr')}")
                        except Exception as decode_error:
                            logger.warning(f"Could not decode id_token: {decode_error}")

                # Add userinfo to token data before updating session (if available)
                if payload_json:
                    combined_token_data["userinfo"] = payload_json

                # Step 6: Update FastAPI session with combined tokens and userinfo
                logger.info(
                    "Updating FastAPI session with elevated authentication (password + FIDO2)"
                )
                # Get the handler and set sid as session id (from id_token), if available
                if payload_json and payload_json.get("sid"):
                    handler = get_session_handler(request)
                    new_session_id = payload_json.get("sid")
                    handler.session_id = new_session_id
                    logger.info(
                        f"Updated session ID to sid from id_token: {new_session_id}"
                    )

                update_session_tokens(request, combined_token_data)

                # Clean up stepup tokens from session after successful authentication
                if "stepup_token_data" in request.session:
                    del request.session["stepup_token_data"]
                if "stepup_token_timestamp" in request.session:
                    del request.session["stepup_token_timestamp"]

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
