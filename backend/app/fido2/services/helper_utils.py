"""
Helper utilities for FIDO2 services
"""

import logging
from typing import Dict, Any
from urllib.parse import urlparse
from fastapi import HTTPException, status
from httpx import AsyncClient
from app.utils.access_token import get_auth_request_headers
from app.utils.request_error_handler import RequestErrorHandler
from app.config import get_configuration
from app.constants.verify_endpoints import VerifyAPIEndpoint
from app.users.services.get_my_profile import dispatch_get_my_profile_from_ibm

logger = logging.getLogger(__name__)


def get_rp_id() -> str:
    """Get the RP ID (relying party ID) from configuration"""
    config = get_configuration()
    parsed_url = urlparse(config.ibm_verify_config.IBM_VERIFY_TENANT_URL)
    return parsed_url.hostname


def get_tenant_url() -> str:
    """Get the IBM Verify tenant URL from configuration"""
    config = get_configuration()
    return config.ibm_verify_config.IBM_VERIFY_TENANT_URL


async def get_user_profile_info(
    http_client: AsyncClient, user_access_token: str
) -> tuple[str, str, str]:
    """
    Get username and displayName from user profile using their access token.

    Returns:
        tuple[str, str]: (username, displayName)
    """
    logger.info("Fetching user profile for FIDO2 operation")
    profile = await dispatch_get_my_profile_from_ibm(http_client, user_access_token)

    username = profile.userName
    user_id = profile.id

    # Construct display name from profile
    display_name = ""
    if profile.name:
        if profile.name.givenName and profile.name.familyName:
            display_name = f"{profile.name.givenName} {profile.name.familyName}"
        elif profile.name.formatted:
            display_name = profile.name.formatted
        elif profile.name.givenName:
            display_name = profile.name.givenName
        elif profile.name.familyName:
            display_name = profile.name.familyName

    # Fallback to username if no display name could be constructed
    if not display_name:
        display_name = username

    logger.info("Retrieved user profile for FIDO2 operation")
    return username, display_name, user_id


async def get_rp_uuid_from_rp_id(
    http_client: AsyncClient, access_token: str, rp_id: str
) -> str:
    """Get RP UUID from RP ID by querying the discovery service"""
    tenant_url = get_tenant_url()
    url = f"{tenant_url}{VerifyAPIEndpoint.FIDO2_RELYING_PARTIES.value}"
    headers = get_auth_request_headers(access_token, json_content_type=True)

    response = await http_client.get(url, headers=headers)
    response.raise_for_status()

    rp_data = response.json()

    # Handle both old and new response schemas
    rp_wrapper = rp_data.get("fido2", rp_data)
    relying_parties = rp_wrapper.get("relyingparties", [])

    for rp in relying_parties:
        if rp.get("rpId") == rp_id:
            return rp.get("id")

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"RP ID '{rp_id}' not found",
    )


async def verify_registration_ownership(
    http_client: AsyncClient,
    access_token: str,
    registration_id: str,
    user_id: str,
) -> Dict[str, Any]:
    """
    Verify that a registration belongs to the specified user.

    Returns:
        Dict[str, Any]: The registration data if ownership is verified

    Raises:
        HTTPException: If the user does not own the registration
    """
    tenant_url = get_tenant_url()
    reg_url = f"{tenant_url}{VerifyAPIEndpoint.FIDO2_REGISTRATIONS.value}/{registration_id}"
    headers = get_auth_request_headers(access_token, json_content_type=True)

    reg_response = await http_client.get(reg_url, headers=headers)
    reg_response.raise_for_status()

    registration_data = reg_response.json()

    if registration_data.get("userId") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not owner of registration",
        )

    return registration_data
