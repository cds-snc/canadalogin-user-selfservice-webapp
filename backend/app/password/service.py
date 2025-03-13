import logging
from fastapi import Depends, HTTPException
from datetime import datetime
from httpx import AsyncClient
from app.utils.dependencies import get_access_token
from app.config import get_settings

logger = logging.getLogger(__name__)


async def request_password_policy(access_token: str = Depends(get_access_token)):
    settings = get_settings().ibm_verify_config

    password_policy_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/PasswordPolicies"

    logger.debug(f"Password Policy URL: {password_policy_url}")

    async with AsyncClient() as client:
        response = await client.post(password_policy_url, headers={"Content-Type": "application/x-www-form-urlencoded", "Authorization": f"Bearer {access_token}"})

        if response.status_code != 200:
            logger.error(
                f"Failed to get access token. Response: {response}")
            raise HTTPException(
                status_code=response.status_code, detail="Failed to get access token")

        logger.info("Request returned successfully")
        return response


async def get_password_policy():
    """Get password policy from IBM Verify API"""
    """Request token from IBM Verify API"""
    password_policy = await request_password_policy()
    return password_policy.json()


async def test_me():
    """
    Root endpoint of the API.

    Returns:
        RootResponse: A simple welcome message
    """
    return {"name": "test me"}
