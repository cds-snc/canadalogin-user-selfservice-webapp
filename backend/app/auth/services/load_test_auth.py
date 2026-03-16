import logging

from fastapi import HTTPException, status
from httpx import AsyncClient

from app.config import get_configuration
from app.constants.verify_endpoints import VerifyAPIEndpoint

logger = logging.getLogger(__name__)


async def ropc_authenticate(
    http_client: AsyncClient, username: str, password: str
) -> dict:
    """Authenticate a test user via ROPC grant and return tokens + userinfo."""
    settings = get_configuration()
    verify_config = settings.ibm_verify_config
    token_url = f"{verify_config.IBM_VERIFY_TENANT_URL}{VerifyAPIEndpoint.GET_ACCESS_TOKEN.value}"

    token_response = await http_client.post(
        token_url,
        data={
            "grant_type": "password",
            "username": username,
            "password": password,
            "client_id": verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID,
            "client_secret": verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_SECRET,
            "scope": "openid email profile phone",
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    if token_response.status_code != 200:
        logger.error(
            "ROPC token request failed: status=%s body=%s",
            token_response.status_code,
            token_response.text,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ROPC authentication failed — check test user credentials",
        )

    tokens = token_response.json()

    # Fetch userinfo to get the sid (used as session ID)
    userinfo_url = f"{verify_config.IBM_VERIFY_TENANT_URL}{VerifyAPIEndpoint.USERINFO.value}"
    userinfo_response = await http_client.get(
        userinfo_url,
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )

    if userinfo_response.status_code != 200:
        logger.error(
            "Userinfo request failed: status=%s body=%s",
            userinfo_response.status_code,
            userinfo_response.text,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch userinfo after ROPC authentication",
        )

    tokens["userinfo"] = userinfo_response.json()
    return tokens
