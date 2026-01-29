"""
Service for validating FIDO2 login/authentication
"""

import logging
from typing import Dict, Any
from fastapi import HTTPException, status
from httpx import AsyncClient
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.request_error_handler import RequestErrorHandler
from app.constants.verify_endpoints import VerifyAPIEndpoint
from app.fido2.schemas import (
    FIDO2UserResponse,
    FIDO2UserResponseModel,
)
from app.fido2.services.helper_utils import (
    get_tenant_url,
    get_rp_id,
    get_rp_uuid_from_rp_id,
)

logger = logging.getLogger(__name__)


async def validate_fido2_login(
    http_client: AsyncClient, assertion_result: Dict[str, Any]
) -> FIDO2UserResponseModel:
    """
    Validate FIDO2 assertion and complete login
    """
    try:
        tenant_url = get_tenant_url()
        rp_id = get_rp_id()

        access_token = await get_admin_token(http_client)
        rp_uuid = await get_rp_uuid_from_rp_id(http_client, access_token, rp_id)

        # Submit assertion result
        url = f"{tenant_url}{VerifyAPIEndpoint.FIDO2_RP_BASE.value}/{rp_uuid}/assertion/result"
        headers = get_auth_request_headers(access_token, json_content_type=True)

        response = await http_client.post(url, headers=headers, json=assertion_result)
        response.raise_for_status()

        assertion_response = response.json()
        user_id = assertion_response.get("userId")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid assertion result",
            )

        # Get user details
        user_url = f"{tenant_url}{VerifyAPIEndpoint.USERS.value}"
        user_params = {"filter": f'id eq "{user_id}"'}

        user_response = await http_client.get(
            user_url,
            headers=get_auth_request_headers(access_token),
            params=user_params,
        )
        user_response.raise_for_status()

        user_data = user_response.json()

        if user_data.get("totalResults") == 1:
            user = user_data["Resources"][0]
            if user.get("active", False):
                username = user["userName"]
                display_name = user.get("name", {}).get("formatted", username)

                # Create a user response for successful FIDO2 login
                # Since this is for login validation, we'll return a minimal response
                user_response = FIDO2UserResponse(
                    authenticated=True,
                    username=username,
                    displayName=display_name,
                    credentials=[],  # Don't need to fetch full credentials for login validation
                )

                return FIDO2UserResponseModel(
                    success=True,
                    data=user_response,
                    message="FIDO2 login validated successfully",
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, detail="User disabled"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User record not found",
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating FIDO2 login: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)
