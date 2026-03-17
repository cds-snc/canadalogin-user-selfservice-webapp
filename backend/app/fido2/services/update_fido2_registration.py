"""
Service for updating/renaming FIDO2 registrations (passkeys)
"""

import logging
from httpx import AsyncClient
from app.utils.access_token import get_auth_request_headers
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel
from app.constants.verify_endpoints import VerifyAPIEndpoint
from app.fido2.schemas import UpdateRegistrationRequest
from app.fido2.services.helper_utils import (
    get_tenant_url,
    get_user_profile_info,
    verify_registration_ownership,
)

logger = logging.getLogger(__name__)


async def update_registration(
    http_client: AsyncClient,
    user_access_token: str,
    request_data: UpdateRegistrationRequest,
) -> ResponseModel:
    """Update a FIDO2 registration (nickname, enabled status)"""
    try:
        tenant_url = get_tenant_url()
        registration_id = request_data.id

        _username, _display_name, user_id = await get_user_profile_info(
            http_client, user_access_token
        )

        # Verify ownership and get registration data
        registration_data = await verify_registration_ownership(
            http_client, user_access_token, registration_id, user_id
        )

        # Prepare update payload - IBM Verify API requires PUT with complete object
        # Start with current registration data and update specific fields
        current_attributes = registration_data.get("attributes", {})
        update_payload = registration_data.copy()  # Preserve all existing fields

        # Ensure required fields are set
        update_payload["id"] = registration_id
        update_payload["userId"] = user_id
        update_payload["attributes"] = (
            current_attributes.copy()
        )  # Preserve existing attributes

        # Override with provided values
        if request_data.nickname is not None:
            # Send nickname inside attributes field
            update_payload["attributes"]["nickname"] = request_data.nickname
        elif "nickname" not in update_payload["attributes"]:
            # Preserve existing nickname from top-level or set empty if none
            existing_nickname = registration_data.get("nickname", "")
            if existing_nickname:
                update_payload["attributes"]["nickname"] = existing_nickname

        if request_data.enabled is not None:
            update_payload["enabled"] = request_data.enabled

        # Update the registration using PUT (required by IBM Verify API)
        reg_url = f"{tenant_url}{VerifyAPIEndpoint.FIDO2_REGISTRATIONS.value}/{registration_id}"
        headers = get_auth_request_headers(user_access_token, json_content_type=True)

        update_response = await http_client.put(
            reg_url, headers=headers, json=update_payload
        )
        update_response.raise_for_status()

        logger.info(f"Registration updated: {registration_id}")

        return ResponseModel(
            success=True, message="FIDO2 registration updated successfully"
        )

    except Exception as e:
        logger.error(f"Error updating registration: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)
