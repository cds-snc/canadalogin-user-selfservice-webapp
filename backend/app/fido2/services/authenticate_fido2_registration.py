"""
Service for authenticating with FIDO2 passkeys
"""

import json
import logging
import time
from httpx import AsyncClient, HTTPStatusError
from fastapi import Request
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.schemas import ResponseModel
from app.constants.session_keys import SessionKeys
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


def _format_upstream_assertion_error(response) -> str:
    """Best-effort extraction of useful upstream error details for logging."""
    try:
        payload = response.json()
    except Exception:
        payload = None

    if isinstance(payload, dict):
        details = payload.get("details")
        if isinstance(details, list):
            details = "; ".join(
                str(item.get("message", item)) if isinstance(item, dict) else str(item)
                for item in details
            )

        return (
            f"messageId={payload.get('messageId', 'N/A')} "
            f"messageDescription={payload.get('messageDescription', 'N/A')} "
            f"details={details if details else 'N/A'} "
            f"response_json={json.dumps(payload, default=str)}"
        )

    response_text = getattr(response, "text", "")
    if response_text:
        return f"response_text={response_text}"

    return "response_body=N/A"


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


def _decode_jwt_payload(token: str) -> dict | None:
    """
    Decode the payload of a JWT token without signature validation.

    Args:
        token: JWT token string in header.payload.signature format

    Returns:
        Decoded payload dictionary, or None if decoding fails
    """
    parts = token.split(".")
    if len(parts) != 3:
        return None

    payload_b64 = parts[1]
    # Base64url may omit padding — restore it
    padding = 4 - (len(payload_b64) % 4)
    if padding != 4:
        payload_b64 += "=" * padding

    try:
        payload_bytes = base64.b64decode(payload_b64)
        return json.loads(payload_bytes)
    except Exception as e:
        logger.warning(f"Could not decode JWT payload: {e}")
        return None


def _validate_stepup_tokens(request: Request) -> dict | None:
    """
    Validate that a valid, unexpired stepup token exists in the session.

    Must be called before FIDO2 step-up authentication to ensure password
    verification has been performed (POST /v1/password/verify/stepup).

    Args:
        request: FastAPI Request with session data

    Returns:
        stepup_token_data dict from the session, or None if not present

    Raises:
        Exception: If stepup tokens are expired
    """
    stepup_token_data = request.session.get("stepup_token_data")
    stepup_token_timestamp = request.session.get("stepup_token_timestamp")

    if not stepup_token_data:
        logger.warning(
            "No stepup_token_data in session. Skipping step-up token validation."
        )
        return None

    if _is_token_expired(stepup_token_data, stepup_token_timestamp):
        logger.error(
            "Step-up token has expired. Password verification must be performed again."
        )
        raise Exception(
            "Step-up token expired: Please call POST /v1/password/verify/stepup again."
        )

    return stepup_token_data


async def _get_mfa_challenge_token(
    request: Request,
    http_client: AsyncClient,
    tenant_url: str,
) -> str | None:
    """
    Validate stepup session and obtain an MFA challenge token via refresh flow.

    Combines steps 2–3: validates the stepup token from the session, then
    performs a refresh token flow to obtain the MFA challenge token needed
    for FIDO2 step-up authentication.

    Args:
        request: FastAPI Request with session data
        http_client: AsyncClient for making HTTP requests
        tenant_url: IBM Verify tenant URL

    Returns:
        MFA challenge access token string, or None if no stepup token is present in session

    Raises:
        Exception: If stepup token data is missing, tokens are expired, or MFA refresh fails
    """
    stepup_token_data = _validate_stepup_tokens(request)

    if stepup_token_data is None:
        raise Exception("Step-up authentication required")

    stepup_refresh_token = stepup_token_data.get("refresh_token")
    if not stepup_refresh_token:
        raise Exception("No refresh_token in stepup token data")

    settings = get_configuration()
    logger.info("Starting MFA refresh token flow for FIDO2 authentication")
    mfa_token_data = await _perform_mfa_refresh_token_flow(
        http_client=http_client,
        tenant_url=tenant_url,
        refresh_token=stepup_refresh_token,
        client_id=settings.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID,
        client_secret=settings.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_SECRET,
    )

    mfa_challenge_token = mfa_token_data.get("access_token")
    logger.info("MFA challenge token obtained")
    return mfa_challenge_token


def _build_merged_session_token(
    request: Request,
    combined_token_data: dict,
    combined_amr: list | None,
) -> dict:
    """
    Build merged session token preserving the original id_token.

    The jwt-bearer exchange returns a new id_token tied to a different IBM Verify
    session. Replacing it would cause rplogout to receive an id_token_hint that
    doesn't match the browser's existing ci_session cookie, triggering the logout
    consent screen.

    Strategy: keep the original id_token and original userinfo fields (including
    the original sid), but update the access_token, refresh_token, and AMR claims.

    Args:
        request: FastAPI Request with existing session data
        combined_token_data: Token response from the jwt-bearer exchange
        combined_amr: AMR claims from the combined id_token (may be None)

    Returns:
        Merged token dict ready to pass to update_session_tokens
    """
    existing_token = request.session.get(SessionKeys.SESSION_USER_TOKEN.value, {})
    original_id_token = existing_token.get("id_token")
    original_userinfo = existing_token.get("userinfo", {})

    merged_token_data = dict(combined_token_data)
    merged_token_data["id_token"] = original_id_token

    merged_userinfo = dict(original_userinfo)
    if combined_amr:
        merged_userinfo["amr"] = combined_amr
    merged_token_data["userinfo"] = merged_userinfo

    return merged_token_data


async def _exchange_and_update_session(
    request: Request,
    http_client: AsyncClient,
    tenant_url: str,
    fido2_jwt: str,
) -> None:
    """
    Exchange FIDO2 JWT for a combined access token and update the session.

    Performs steps 5–6 of the FIDO2 step-up flow:
      - Step 5: Exchange the FIDO2 assertion JWT for a combined access token
                (password + fido2 AMR) via the jwt-bearer grant.
      - Step 6: Merge the elevated access_token/refresh_token into the existing
                session while preserving the original id_token so that rplogout
                continues to match the browser's ci_session cookie.
      - Cleanup: Remove stepup_token_data and stepup_token_timestamp from session.

    Args:
        request: FastAPI Request with session data
        http_client: AsyncClient for making HTTP requests
        tenant_url: IBM Verify tenant URL
        fido2_jwt: FIDO2 assertion JWT from the assertion result response
    """
    from app.auth.services.auth_user_session import update_session_tokens

    settings = get_configuration()

    combined_token_data = await _exchange_fido2_jwt_for_access_token(
        http_client=http_client,
        tenant_url=tenant_url,
        fido2_jwt=fido2_jwt,
        client_id=settings.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID,
        client_secret=settings.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_SECRET,
    )

    # Decode AMR claims from the combined id_token for logging and session patching
    combined_amr = None
    combined_id_token = combined_token_data.get("id_token")
    if combined_id_token:
        payload = _decode_jwt_payload(combined_id_token)
        if payload:
            combined_amr = payload.get("amr")
            logger.info(
                f"Combined token amr: {combined_amr}, sid: {payload.get('sid')}"
            )

    logger.info(
        "Updating FastAPI session with elevated authentication (password + FIDO2)"
    )
    merged_token_data = _build_merged_session_token(
        request, combined_token_data, combined_amr
    )
    update_session_tokens(request, merged_token_data)
    logger.info("Preserved original id_token; updated access_token and amr claims")

    # Clean up stepup tokens from session after successful authentication
    request.session.pop("stepup_token_data", None)
    request.session.pop("stepup_token_timestamp", None)
    logger.info("Session updated with combined password + FIDO2 authentication tokens")


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
        "userVerification": request_data.userVerification or "required",
    }

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
    headers = get_auth_request_headers(user_access_token, json_content_type=True)

    response = await http_client.post(url, headers=headers, json=body_to_send)
    logger.info(f"Assertion options response status: {response.status_code}")
    response.raise_for_status()

    response_data = response.json()
    return ResponseModel(
        success=True,
        data=response_data,
        message="Assertion options retrieved successfully",
    )


async def submit_assertion_result(
    request: Request,
    http_client: AsyncClient,
    user_access_token: str,
    request_body: FIDO2AssertionResultRequest,
    return_jwt: bool = False,
) -> ResponseModel:
    """
    Submit FIDO2 assertion result to complete passkey authentication.

    When return_jwt=True this function performs the full step-up flow:
      Step 2: Validate stepup session tokens (set by POST /v1/password/verify/stepup)
      Step 3: MFA refresh token flow → MFA challenge token
      Step 4: Submit assertion result with MFA challenge token + returnJwt=true
      Step 5: Exchange FIDO2 JWT → combined access token (password + fido2 AMR)
      Step 6: Merge elevated tokens into session, preserving original id_token

    Args:
        request: FastAPI Request object for session access
        http_client: AsyncClient for making HTTP requests
        user_access_token: User's authentication token
        request_body: Assertion result data from the client
        return_jwt: If True, IBM Verify will return a JWT token in the response
                   that can be used for step-up auth with combined AMR claims

    Returns:
        ResponseModel with authentication result
    """
    tenant_url = get_tenant_url()
    rp_id = get_rp_id()
    admin_token = await get_admin_token(http_client)
    rp_uuid = await get_rp_uuid_from_rp_id(http_client, admin_token, rp_id)
    body_to_send = request_body.model_dump(exclude_none=True)

    # Steps 2–3: Validate stepup session and get MFA challenge token
    mfa_challenge_token = None
    if return_jwt:
        mfa_challenge_token = await _get_mfa_challenge_token(
            request, http_client, tenant_url
        )

    # Step 4: Submit FIDO2 assertion result
    auth_token = mfa_challenge_token if mfa_challenge_token else user_access_token
    url = f"{tenant_url}{VerifyAPIEndpoint.FIDO2_RP_BASE.value}/{rp_uuid}/assertion/result"
    if return_jwt and mfa_challenge_token:
        url += "?returnJwt=true"
        logger.info("Requesting JWT token in assertion result response")

    headers = get_auth_request_headers(auth_token, json_content_type=True)
    http_response = await http_client.post(url, headers=headers, json=body_to_send)
    try:
        http_response.raise_for_status()
    except HTTPStatusError:
        logger.error(
            "Upstream FIDO2 assertion result request failed "
            f"status={http_response.status_code} "
            f"url={url} "
            f"rp_uuid={rp_uuid} "
            f"return_jwt={return_jwt} "
            f"credential_id={body_to_send.get('id', 'N/A')} "
            f"credential_type={body_to_send.get('type', 'N/A')} "
            f"response_keys={sorted(body_to_send.get('response', {}).keys())} "
            f"{_format_upstream_assertion_error(http_response)}"
        )
        raise

    response_data = http_response.json()
    logger.info("Assertion result submitted successfully")

    # Steps 5–6: Exchange FIDO2 JWT and update session
    if return_jwt and "assertion" in response_data:
        fido2_jwt = response_data["assertion"]
        logger.info("FIDO2 assertion JWT received, proceeding with token exchange")
        try:
            await _exchange_and_update_session(
                request, http_client, tenant_url, fido2_jwt
            )
        except Exception as exchange_error:
            logger.error(
                f"Error exchanging FIDO2 JWT for combined token: {str(exchange_error)}",
                exc_info=True,
            )
            # Don't fail the whole request if token exchange fails —
            # the FIDO2 assertion itself succeeded

    return ResponseModel(
        success=True,
        data=response_data,
        message="FIDO2 authentication completed successfully",
    )
