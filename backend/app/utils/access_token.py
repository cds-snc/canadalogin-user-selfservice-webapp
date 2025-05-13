import json
import logging
from datetime import datetime, timedelta
from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError
from app.config import get_settings
import os

from app.utils.helpers import generate_error_response
from app.utils.schemas import AdminTokenResponse

logger = logging.getLogger(__name__)
settings = get_settings().ibm_verify_config


async def get_admin_token(global_http_client: AsyncClient, admin_token_cache_file):
    # At the start of the application a temp file will be created at runtime. Detect the empty file.
    if os.stat(admin_token_cache_file.name).st_size == 0:
        return await request_access_token(global_http_client, admin_token_cache_file)
    else:
        # Open the file to overwrite old token data. Only one token at a time can be cached.
        with open(admin_token_cache_file.name, "r") as file:
            token_data = file.read()
            if not is_expired_token(token_data):
                data = AdminTokenResponse(**json.loads(token_data))
                return data.access_token
            else:
                return await request_access_token(
                    global_http_client, admin_token_cache_file
                )


async def request_access_token(global_http_client: AsyncClient, admin_token_cache_file):
    """Request token from IBM Verify API"""
    try:
        token_url = f"{settings.IBM_VERIFY_TENANT_URL}/oauth2/token"
        logger.info(f"Attempting to get access token from: {token_url}")

        data = {
            "grant_type": "client_credentials",
            "client_id": settings.IBM_VERIFY_API_CLIENT_ID,
            "client_secret": settings.IBM_VERIFY_API_CLIENT_SECRET,
            "scope": "openid",
        }

        logger.debug(f"Token URL: {token_url}")

        start_time = datetime.now()
        response = await global_http_client.post(
            token_url,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"Token request completed in {duration:.2f} seconds")

        try:
            validated_token = AdminTokenResponse(**response.json())
            validated_token.created = datetime.now()
        except ValidationError as e:
            logger.error(f"Validation Error: {e.json()}")
            print(json.dumps(e.json(), indent=4))
            raise HTTPException(status_code=422, detail="Response validation error")

        if response.status_code != 200:
            logger.error(f"Failed to get admin token. Response: {response}")
            return generate_error_response(response.status_code, response.json())

        # Write new token to cache
        with open(admin_token_cache_file.name, "w") as file:
            file.write(validated_token.model_dump_json())

        logger.info("Request returned successfully")
        return response.json()["access_token"]

    except Exception as e:
        logger.error(f"Error getting admin token: {str(e)}", exc_info=True)
        return generate_error_response(500, str(e))


def is_expired_token(token_data):
    token = AdminTokenResponse(**json.loads(token_data))
    # Verify's default oath token TTL (expires_in) is 7200sec/2hrs. 5 minutes = 300 seconds,
    # giving us a grace period of 5 minute before TTL.

    return datetime.now() - token.created >= timedelta(seconds=token.expires_in - 300)


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
