import logging
import threading
from datetime import datetime
from fastapi import HTTPException
from httpx import AsyncClient
from app.config import get_configuration
from app.utils.request_error_handler import RequestErrorHandler

logger = logging.getLogger(__name__)
lock = threading.Lock()

admin_token_ttl = 7170


async def request_access_token(global_http_client: AsyncClient):
    """Request token from IBM Verify API"""
    try:
        settings = get_configuration().ibm_verify_config

        token_url = f"{settings.IBM_VERIFY_TENANT_URL}/oauth2/token"
        logger.info(f"Attempting to get access token from: {token_url}")

        data = {
            "grant_type": "client_credentials",
            "client_id": settings.IBM_VERIFY_PROFILE_MANAGEMENT_API_CLIENT_ID,
            "client_secret": settings.IBM_VERIFY_PROFILE_MANAGEMENT_API_SECRET,
            "scope": "openid",
        }
        logger.debug(f"Token URL: {token_url}")

        response = await global_http_client.post(
            token_url,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        response.raise_for_status()
        logger.info("Request returned successfully")
        return response

    except Exception as e:
        logger.error(f"Error requesting token: {str(e)}", exc_info=True)
        await RequestErrorHandler.handle(e)


async def get_admin_token(global_http_client: AsyncClient) -> str:
    """Get access token for IBM Verify API operations"""
    try:
        logger.info("Attempting to get access token")

        start_time = datetime.now()
        response = await request_access_token(global_http_client)  # Await the coroutine
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"Token request completed in {duration:.2f} seconds")
        response_json = response.json()
        access_token = response_json.get("access_token")
        if not access_token:
            logger.error(
                "Failed to get access token. Status=%s, Body=%s",
                response.status_code,
                response.text,
            )
            raise HTTPException(status_code=400, detail="Server Error")
        return access_token
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        logger.error("Unexpected error getting token", exc_info=True)
        raise HTTPException(status_code=500, detail="Unexpected server error") from e


def get_auth_request_headers(
    access_token: str, json_content_type: bool = False
) -> dict:
    """Headers and access token to be included in the Authorization header

    Args:
      access_token (str): The access token to be included in the Authorization header.
      json_content_type (bool): If True, the Content-Type and Accept headers will be set to "application/json".

      Returns:
          dict: A dictionary containing the authentication headers, including:
              - "Authorization": "Bearer <access_token>"
              - "Content-Type": "application/scim+json"
              - "Accept": "application/scim+json"

    """
    headers = {}

    if json_content_type:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        return headers

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/scim+json",
        "Accept": "application/scim+json",
    }
    return headers
