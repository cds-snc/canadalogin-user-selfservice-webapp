"""
Service for adding/registering new FIDO2 passkeys
"""

import logging
from typing import Dict, Any
from httpx import AsyncClient
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.schemas import ResponseModel
from app.constants.verify_endpoints import VerifyAPIEndpoint
from app.fido2.services.helper_utils import (
    get_tenant_url,
    get_rp_id,
    get_rp_uuid_from_rp_id,
    get_user_profile_info,
)
from app.fido2.schemas import AttestationOptionsRequest

logger = logging.getLogger(__name__)


def _prepare_attestation_result_body(body_to_send: Dict[str, Any]) -> Dict[str, Any]:
    """Prepare body for attestation/result endpoint"""
    # Add enabled: true like ciservices.js does
    body_to_send["enabled"] = True

    # Ensure getClientExtensionResults is an empty object if null/None
    if body_to_send.get("getClientExtensionResults") is None:
        body_to_send["getClientExtensionResults"] = {}

    return body_to_send


async def get_attestation_options(
    http_client: AsyncClient,
    user_access_token: str,
    request_data: AttestationOptionsRequest,
) -> ResponseModel:
    """
    Get FIDO2 attestation options for starting passkey registration.
    Automatically injects user profile information.
    """

    # Set proper defaults for FIDO2 attestation
    request_body = {
        "attestation": "direct",
        "authenticatorSelection": {
            "requireResidentKey": False,
            "userVerification": "preferred",
        },
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
    body_to_send = request_body.copy() if request_body else {}
    body_to_send["displayName"] = display_name
    body_to_send["userId"] = user_id

    logger.info(
        f"Attestation options - username: {username}, displayName: {display_name}"
    )

    # Make the request
    url = f"{tenant_url}{VerifyAPIEndpoint.FIDO2_RP_BASE.value}/{rp_uuid}/attestation/options"
    headers = get_auth_request_headers(user_access_token, json_content_type=True)

    response = await http_client.post(url, headers=headers, json=body_to_send)
    logger.info(response)
    response.raise_for_status()

    response_data = response.json()
    return ResponseModel(
        success=True,
        data=response_data,
        message="Attestation options retrieved successfully",
    )


async def submit_attestation_result(
    http_client: AsyncClient,
    user_access_token: str,
    request_body: Dict[str, Any],
) -> ResponseModel:
    """
    Submit FIDO2 attestation result to complete passkey registration.
    """
    tenant_url = get_tenant_url()
    rp_id = get_rp_id()

    # Get admin token for RP operations
    admin_token = await get_admin_token(http_client)
    rp_uuid = await get_rp_uuid_from_rp_id(http_client, admin_token, rp_id)

    # Prepare request body
    body_to_send = request_body.copy() if request_body else {}
    body_to_send = _prepare_attestation_result_body(body_to_send)

    # Make the request
    url = f"{tenant_url}{VerifyAPIEndpoint.FIDO2_RP_BASE.value}/{rp_uuid}/attestation/result"
    headers = get_auth_request_headers(user_access_token, json_content_type=True)

    response = await http_client.post(url, headers=headers, json=body_to_send)
    response.raise_for_status()

    response_data = response.json()
    logger.info("Attestation result submitted successfully")

    return ResponseModel(
        success=True,
        data=response_data,
        message="FIDO2 registration completed successfully",
    )
