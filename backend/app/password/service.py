import logging
from fastapi import Depends, HTTPException
from datetime import datetime
from httpx import AsyncClient
from app.utils.dependencies import get_access_token
from app.config import get_settings

logger = logging.getLogger(__name__)


async def request_password_policy(access_token: str):
    settings = get_settings().ibm_verify

    password_policy_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/PasswordPolicies"

    logger.debug(f"Password Policy URL: {password_policy_url}")

    async with AsyncClient() as client:
        response = await client.post(password_policy_url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded", "Authorization": f"Bearer {access_token}"})

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
    ibm_access_token = await get_access_token()
    return ibm_access_token


async def test_me():
    """
    Root endpoint of the API.

    Returns:
        RootResponse: A simple welcome message
    """
    return {"name": "test me"}
# Compare this snippet from backend/app/utils/dependencies.py:
