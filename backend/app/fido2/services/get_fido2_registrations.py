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
    FIDO2CredentialSummary,
    FIDO2UserResponse,
    FIDO2UserResponseModel,
    FIDO2CredentialsResponseModel,
)
from app.fido2.services.helper_utils import (
    get_rp_id,
    get_tenant_url,
    get_rp_uuid_from_rp_id,
    get_user_id_from_token,
)

logger = logging.getLogger(__name__)


async def get_user_fido2_registrations(
    http_client: AsyncClient, user_access_token: str
) -> FIDO2CredentialsResponseModel:
    """Get all FIDO2 registrations for a user using their own access token"""
    try:
        tenant_url = get_tenant_url()
        rp_id = get_rp_id()

        logger.info("Getting FIDO2 registrations using user access token")
        logger.info(f"Using RPID: {rp_id}")

        # Get user ID from the token using userinfo endpoint
        user_id = await get_user_id_from_token(http_client, user_access_token)
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

        credentials = []

        for reg in registrations_data.get("fido2", []):
            credential = FIDO2CredentialSummary(
                id=reg.get("id"),
                nickname=reg.get("attributes", {}).get("nickname"),
                enabled=reg.get("enabled", False),
                created=reg.get("created"),
                rpId=reg.get("attributes", {}).get("rpId"),
                credentialId=reg.get("attributes", {}).get("credentialId"),
                transactions=[],  # TODO: Add transaction support if needed
            )
            credentials.append(credential)

        logger.info(f"Found {len(credentials)} FIDO2 credentials")
        return FIDO2CredentialsResponseModel(
            success=True,
            data=credentials,
            message="FIDO2 credentials retrieved successfully",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting FIDO2 registrations: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)


async def get_user_response(
    http_client: AsyncClient,
    user_access_token: str,
) -> FIDO2UserResponseModel:
    """Get user response with FIDO2 credentials"""
    try:
        credentials_response = await get_user_fido2_registrations(
            http_client, user_access_token
        )

        user_response = FIDO2UserResponse(
            authenticated=True,
            username=None,  # We can extract this from token if needed
            displayName=None,
            credentials=credentials_response.data or [],
        )

        return FIDO2UserResponseModel(
            success=True,
            data=user_response,
            message="User FIDO2 data retrieved successfully",
        )

    except Exception as e:
        logger.error(f"Error getting user response: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)
