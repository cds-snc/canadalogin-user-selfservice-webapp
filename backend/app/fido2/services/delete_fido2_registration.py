"""
Service for deleting FIDO2 registrations (passkeys)
"""

import logging
from httpx import AsyncClient
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.request_error_handler import RequestErrorHandler
from app.constants.verify_endpoints import VerifyAPIEndpoint
from app.fido2.schemas import (
    DeleteRegistrationRequest,
)
from app.fido2.services.helper_utils import (
    get_tenant_url,
    get_user_profile_info,
    verify_registration_ownership,
)
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def delete_registration(
    http_client: AsyncClient,
    user_access_token: str,
    request_data: DeleteRegistrationRequest,
) -> ResponseModel:
    """Delete a FIDO2 registration"""
    try:
        tenant_url = get_tenant_url()
        registration_id = request_data.id

        # Get user ID from the token using userinfo endpoint
        _username, _display_name, user_id = await get_user_profile_info(
            http_client, user_access_token
        )

        # Get admin token for delete operations (might need admin access)
        admin_token = await get_admin_token(http_client)

        # Verify ownership
        await verify_registration_ownership(
            http_client, admin_token, registration_id, user_id
        )

        # Delete the registration
        reg_url = f"{tenant_url}{VerifyAPIEndpoint.FIDO2_REGISTRATIONS.value}/{registration_id}"
        headers = get_auth_request_headers(admin_token, json_content_type=True)

        delete_response = await http_client.delete(reg_url, headers=headers)
        delete_response.raise_for_status()

        logger.info(f"Registration deleted: {registration_id}")

        # Return success response (IBM Verify API returns 204 No Content on success)
        return ResponseModel(
            success=True,
            message="FIDO2 registration deleted successfully",
        )

    except Exception as e:
        logger.error(f"Error deleting registration: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)
