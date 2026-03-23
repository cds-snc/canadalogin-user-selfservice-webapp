"""
Service for retrieving FIDO2 registrations
"""

import logging
from httpx import AsyncClient
from fastapi import HTTPException
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.request_error_handler import RequestErrorHandler
from app.constants.verify_endpoints import VerifyAPIEndpoint
from app.fido2.schemas import (
    FIDO2UserResponseModel,
)
from app.fido2.services.helper_utils import (
    get_rp_id,
    get_tenant_url,
    get_rp_uuid_from_rp_id,
    get_user_profile_info,
)

logger = logging.getLogger(__name__)


async def get_user_fido2_registrations(
    http_client: AsyncClient, user_access_token: str
) -> FIDO2UserResponseModel:
    """Get all FIDO2 registrations for a user using their own access token"""
    tenant_url = get_tenant_url()
    rp_id = get_rp_id()

    logger.info("Getting FIDO2 registrations using user access token")
    logger.info(f"Using RPID: {rp_id}")

    # Get user ID from the token using userinfo endpoint
    _username, _display_name, user_id = await get_user_profile_info(
        http_client, user_access_token
    )
    logger.info(f"Found user ID from userinfo: {user_id}")

    # Get RP UUID from RP ID
    admin_token = await get_admin_token(http_client)
    rp_uuid = await get_rp_uuid_from_rp_id(http_client, admin_token, rp_id)
    logger.info(f"Found RP UUID: {rp_uuid}")

    # Search for registrations using user's own token and RP UUID
    url = f"{tenant_url}{VerifyAPIEndpoint.FIDO2_REGISTRATIONS.value}"
    headers = get_auth_request_headers(user_access_token, json_content_type=True)

    # Use the same filter approach as JavaScript: userId + references/rpUuid
    search_filter = f'userId="{user_id}"&references/rpUuid="{rp_uuid}"'
    params = {"search": search_filter}

    logger.info(f"Making request to: {url}")
    logger.info(f"Search filter: {search_filter}")

    response = await http_client.get(url, headers=headers, params=params)
    response.raise_for_status()

    registrations_data = response.json()

    return FIDO2UserResponseModel(
        success=True,
        data=registrations_data,
        message="FIDO2 credentials retrieved successfully",
    )
