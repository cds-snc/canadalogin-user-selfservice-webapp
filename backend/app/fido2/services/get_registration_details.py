"""
Service for getting FIDO2 registration details
"""

import logging
from httpx import AsyncClient
from fastapi import HTTPException
from app.utils.request_error_handler import RequestErrorHandler
from app.fido2.schemas import (
    FIDO2RegistrationResponse,
    FIDO2RegistrationResponseModel,
)
from app.fido2.services.helper_utils import (
    get_user_profile_info,
    verify_registration_ownership,
)

logger = logging.getLogger(__name__)


async def get_registration_details(
    http_client: AsyncClient, user_access_token: str, registration_id: str
) -> FIDO2RegistrationResponseModel:
    """Get details of a specific FIDO2 registration"""
    try:
        # Get user ID from the token using userinfo endpoint
        _username, _display_name, user_id = await get_user_profile_info(
            http_client, user_access_token
        )

        # Verify ownership and get registration data
        registration_data = await verify_registration_ownership(
            http_client, user_access_token, registration_id, user_id
        )

        # TODO: Add transaction data if needed
        registration_data.setdefault("attributes", {})["transactions"] = []

        registration_response = FIDO2RegistrationResponse(**registration_data)
        return FIDO2RegistrationResponseModel(
            success=True,
            data=registration_response,
            message="Registration details retrieved successfully",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting registration details: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)
