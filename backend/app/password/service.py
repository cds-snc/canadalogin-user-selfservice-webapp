import logging
import json
from pydantic import ValidationError
from fastapi import HTTPException
from httpx import AsyncClient
from app.utils.access_token import get_access_token
from app.config import get_settings
from app.utils.access_token import get_auth_request_headers
from app.password.schemas import IBMVerifyPasswordPolicy
from app.utils.schemas import ResponseModel


logger = logging.getLogger(__name__)


async def get_password_policy(global_http_client: AsyncClient):
    """Get password policy from IBM Verify API"""
    try:
        access_token = await get_access_token()
        if not access_token:
            logger.error("Failed to get access token")
            raise HTTPException(status_code=500, detail="Failed to get access token")

        headers = get_auth_request_headers(access_token)
        settings = get_settings().ibm_verify_config

        password_policy_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/PasswordPolicies"

        logger.debug(f"Password Policy URL: {password_policy_url}")

        response = await global_http_client.get(password_policy_url, headers=headers)

        if response.status_code != 200:
            logger.error(f"Failed to get password policy. Response: {response}")
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to get password policy",
            )

        logger.info("Request returned successfully")
        response_json = response.json()
        print(json.dumps(response_json, indent=4))

        try:
            validated_data = IBMVerifyPasswordPolicy(**response_json)
        except ValidationError as e:
            logger.error(f"Validation Error: {e.json()}")
            print(json.dumps(e.json(), indent=4))
            raise HTTPException(status_code=422, detail="Response validation error")

        return ResponseModel(
            success=True,
            data=validated_data,
            message="Password policy retrieved successfully",
        )

    except Exception as e:
        logger.error(f"Error requesting token: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Token request error: {str(e)}")
