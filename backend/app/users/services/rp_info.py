import logging
from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError

from app.users.schemas import RelyingPartyResponse, RelyingPartyInfo
from app.utils.access_token import get_admin_token, get_auth_request_headers

logger = logging.getLogger(__name__)


async def get_relying_party_info(
    global_http_client: AsyncClient,
    relying_party_id,
    rp_user_applications_api_endpoint: str,
):
    try:
        logger.info("Get RP info")
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        response = await global_http_client.get(
            rp_user_applications_api_endpoint, headers=headers
        )
    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")

    if response.status_code == 200:
        logger.info("User profile retrieved successfully.")
        response_data = response.json()
        match = next(
            (
                link
                for app in response_data.get("applications", [])
                for link in app.get("links", [])
                if link.get("id") == relying_party_id
            ),
            None,
        )
        if not match:
            logger.error(f"Relying party with ID {relying_party_id} not found")
            raise HTTPException(status_code=404, detail="Relying party info not found")
        try:
            response_data = RelyingPartyInfo(**match)
            logger.info(f"Relying party profile: {response_data}")
            return RelyingPartyResponse(
                success=True,
                message="User profile retrieved successfully.",
                data=response_data,
            )
        except ValidationError as e:
            logger.error(f"Validation Error: {e.json()}")
            raise HTTPException(
                status_code=422, detail="Response data validation error"
            )

    else:
        logger.error(f"Failed to retrieve profile. Response: {response.text}")
        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Not authenticated")
        else:
            try:
                error_details = response.json()
            except ValueError:
                error_details = {"detail": response.text or "Empty response"}
            raise HTTPException(
                status_code=400,
                detail=f"Failed to fetch RP info: {error_details.get('detail', 'Unknown')}",
            )
