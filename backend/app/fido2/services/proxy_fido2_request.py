"""
Service for proxying FIDO2 requests to IBM Verify API
"""

import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException
from httpx import AsyncClient
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

logger = logging.getLogger(__name__)


async def _prepare_request_body(
    http_client: AsyncClient,
    user_access_token: Optional[str],
    endpoint_path: str,
    request_body: Dict[str, Any],
) -> Dict[str, Any]:
    """Prepare and modify request body for IBM Verify API"""
    body_to_send = request_body.copy() if request_body else {}

    # For attestation options, automatically fetch and inject user profile information
    if endpoint_path.endswith("/attestation/options") and user_access_token:
        username, display_name, user_id = await get_user_profile_info(
            http_client, user_access_token
        )
        body_to_send["username"] = username
        body_to_send["displayName"] = display_name
        logger.info(
            f"Injected user profile info - username: {username}, displayName: {display_name}"
        )

    # Replace username with userId (but NOT for attestation/result)
    if "username" in body_to_send:
        del body_to_send["username"]
        if user_id and not endpoint_path.endswith("/attestation/result"):
            body_to_send["userId"] = user_id

    # Handle specific endpoint modifications
    if endpoint_path.endswith("/attestation/result"):
        body_to_send = _prepare_attestation_result_body(body_to_send)

    return body_to_send


def _prepare_attestation_result_body(body_to_send: Dict[str, Any]) -> Dict[str, Any]:
    """Prepare body for attestation/result endpoint"""
    # Add enabled: true like ciservices.js does
    body_to_send["enabled"] = True

    # Ensure getClientExtensionResults is an empty object if null/None
    if body_to_send.get("getClientExtensionResults") is None:
        body_to_send["getClientExtensionResults"] = {}

    return body_to_send


async def proxy_fido2_request(
    http_client: AsyncClient,
    user_access_token: Optional[str] = None,
    endpoint_path: str = "",
    request_body: Dict[str, Any] = None,
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

        # Prepare request body
        body_to_send = await _prepare_request_body(
            http_client, user_access_token, endpoint_path, request_body
        )

        # Make the request using admin token for FIDO2 operations
        url = f"{tenant_url}{VerifyAPIEndpoint.FIDO2_RP_BASE.value}/{rp_uuid}{endpoint_path}"
        headers = get_auth_request_headers(admin_token, json_content_type=True)

        response = await http_client.post(url, headers=headers, json=body_to_send)
        response.raise_for_status()

        response_data = response.json()
        return ResponseModel(
            success=True,
            data=response_data,
            message="FIDO2 request processed successfully",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error proxying FIDO2 request: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)
