"""
Service for proxying FIDO2 requests to IBM Verify API
"""

import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from httpx import AsyncClient
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel
from app.constants.verify_endpoints import VerifyAPIEndpoint
from app.fido2.services.helper_utils import (
    get_tenant_url,
    get_rp_id,
    get_rp_uuid_from_rp_id,
    get_user_id_from_token,
    get_user_profile_info,
)

logger = logging.getLogger(__name__)


async def _validate_authentication(
    user_id: Optional[str],
    request_body: Dict[str, Any],
    validate_username: bool,
    allow_empty_username: bool,
) -> None:
    """Validate user authentication requirements"""
    username = request_body.get("username") if request_body else None
    if validate_username and not user_id:
        if not (allow_empty_username and username == ""):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )


async def _prepare_request_body(
    http_client: AsyncClient,
    user_access_token: Optional[str],
    endpoint_path: str,
    request_body: Dict[str, Any],
    user_id: Optional[str],
) -> Dict[str, Any]:
    """Prepare and modify request body for IBM Verify API"""
    body_to_send = request_body.copy() if request_body else {}

    # For attestation options, automatically fetch and inject user profile information
    if endpoint_path.endswith("/attestation/options") and user_access_token:
        username, display_name = await get_user_profile_info(
            http_client, user_access_token
        )
        body_to_send["username"] = username
        body_to_send["displayName"] = display_name
        logger.info(
            f"Injected user profile info - username: {username}, displayName: {display_name}"
        )

    # For assertion options, automatically fetch and inject username
    elif endpoint_path.endswith("/assertion/options") and user_access_token:
        username, _ = await get_user_profile_info(http_client, user_access_token)
        body_to_send["username"] = username
        logger.info(f"Injected username for assertion options: {username}")

    # Replace username with userId (but NOT for attestation/result)
    if "username" in body_to_send:
        del body_to_send["username"]
        if user_id and not endpoint_path.endswith("/attestation/result"):
            body_to_send["userId"] = user_id

    # Handle specific endpoint modifications
    if endpoint_path.endswith("/attestation/result"):
        body_to_send = _prepare_attestation_result_body(body_to_send)
    elif endpoint_path.endswith("/assertion/options"):
        body_to_send.pop("attestation", None)

    return body_to_send


def _prepare_attestation_result_body(body_to_send: Dict[str, Any]) -> Dict[str, Any]:
    """Prepare body for attestation/result endpoint"""
    # Add enabled: true like ciservices.js does
    body_to_send["enabled"] = True

    # Ensure getClientExtensionResults is an empty object if null/None
    if body_to_send.get("getClientExtensionResults") is None:
        body_to_send["getClientExtensionResults"] = {}

    return body_to_send


def _handle_error_response(response) -> Dict[str, Any]:
    """Handle error response from IBM Verify API"""
    logger.error(f"IBM Verify API error - Status: {response.status_code}")
    logger.error(f"Response headers: {dict(response.headers)}")
    logger.error(f"Response body: {response.text}")

    try:
        error_data = response.json()
        # Check for IBM Verify error format
        if error_data.get("success") is False and "message" in error_data:
            return {
                "status": "failed",
                "errorMessage": error_data["message"],
            }
        elif "error" in error_data and "messageId" in error_data.get("error", {}):
            # Handle CI-style error format
            error_info = error_data["error"]
            error_message = f"{error_info.get('messageId', '')}: {error_info.get('messageDescription', '')}"
            return {
                "status": "failed",
                "errorMessage": error_message,
            }
        else:
            # Generic error response
            return {
                "status": "failed",
                "errorMessage": f"Unexpected HTTP response code: {response.status_code}",
            }
    except Exception:
        # If JSON parsing fails, return generic error
        return {
            "status": "failed",
            "errorMessage": f"Unexpected HTTP response code: {response.status_code}",
        }


async def proxy_fido2_request(
    http_client: AsyncClient,
    user_access_token: Optional[str] = None,
    endpoint_path: str = "",
    request_body: Dict[str, Any] = None,
    validate_username: bool = True,
    allow_empty_username: bool = False,
) -> ResponseModel:
    """
    Proxy FIDO2 server requests to IBM Verify API
    """
    try:
        tenant_url = get_tenant_url()
        rp_id = get_rp_id()

        # Get admin token for RP operations
        admin_token = await get_admin_token(http_client)
        rp_uuid = await get_rp_uuid_from_rp_id(http_client, admin_token, rp_id)

        user_id = None
        if user_access_token:
            user_id = await get_user_id_from_token(http_client, user_access_token)

        # Validate username if required
        await _validate_authentication(
            user_id, request_body, validate_username, allow_empty_username
        )

        # Prepare request body
        body_to_send = await _prepare_request_body(
            http_client, user_access_token, endpoint_path, request_body, user_id
        )

        # Make the request using admin token for FIDO2 operations
        url = f"{tenant_url}{VerifyAPIEndpoint.FIDO2_RP_BASE.value}/{rp_uuid}{endpoint_path}"
        headers = get_auth_request_headers(admin_token, json_content_type=True)

        response = await http_client.post(url, headers=headers, json=body_to_send)

        # Handle IBM Verify API response
        if response.status_code == 200:
            response_data = response.json()
            return ResponseModel(
                success=True,
                data=response_data,
                message="FIDO2 request processed successfully",
            )
        else:
            error_response = _handle_error_response(response)
            # Raise HTTPException with the same status code as IBM Verify
            raise HTTPException(status_code=response.status_code, detail=error_response)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error proxying FIDO2 request: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)
