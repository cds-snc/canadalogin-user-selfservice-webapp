import logging
from datetime import datetime
from fastapi import Depends, HTTPException
from httpx import AsyncClient
from app.config import get_settings

logger = logging.getLogger(__name__)


async def request_access_token():
    """Request token from IBM Verify API"""
    try:

        settings = get_settings().ibm_verify_config

        token_url = f"{settings.IBM_VERIFY_TENANT_URL}/oauth2/token"
        logger.info(f"Attempting to get access token from: {token_url}")

        data = {
            "grant_type": "client_credentials",
            "client_id": settings.IBM_VERIFY_API_CLIENT_ID,
            "client_secret": settings.IBM_VERIFY_API_CLIENT_SECRET,
            "scope": "openid"
        }
        logger.debug(f"Token URL: {token_url}")

        async with AsyncClient() as client:
            response = await client.post(token_url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})

            if response.status_code != 200:
                logger.error(
                    f"Failed to get access token. Response: {response}")
                raise HTTPException(
                    status_code=response.status_code, detail="Failed to get access token")

            logger.info("Request returned successfully")
            return response

    except Exception as e:

        logger.error(f"Error requesting token: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400, detail=f"Token request error: {str(e)}")


async def get_access_token() -> str:
    """Get access token for IBM Verify API operations"""
    try:
        logger.info("Attempting to get access token")

        start_time = datetime.now()
        response = await request_access_token()
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"Token request completed in {duration:.2f} seconds")

        access_token = response.json().get("access_token")
        if not access_token:
            logger.error(
                f"Failed to get access token. Response: {response}")
            raise HTTPException(
                status_code=500, detail="Failed to get access token")
        print(access_token)
        return access_token

    except Exception as e:
        logger.error(f"Error getting admin token: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400, detail=f"Admin token error: {str(e)}")


def get_auth_request_headers(access_token: str, json_content_type: bool = False) -> dict:
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
            "Accept": "application/json"
        }
        return headers

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/scim+json",
        "Accept": "application/scim+json"
    }
    return headers
