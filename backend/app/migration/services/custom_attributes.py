import logging

from fastapi import HTTPException

from httpx import AsyncClient
from pydantic import ValidationError
from typing import List

from app.config import get_configuration
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.migration.services.utils import get_ibm_id

from app.migration.schemas import (
    MeResponse,
    CustomAttribute,
)

logger = logging.getLogger(__name__)


def get_attribute_value(
    attributes: List[CustomAttribute], key: str
) -> List[str] | None:
    for attr in attributes:
        if attr.name == key:
            return attr.values
    return None


async def get_custom_attribute_List(
    global_http_client: AsyncClient, user_access_token: str
):
    try:

        settings = get_configuration()

        profile_api_endpoint = settings.profile_api_endpoint
        headers = get_auth_request_headers(user_access_token)
        response = await global_http_client.get(profile_api_endpoint, headers=headers)

    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")

    if response.status_code == 200:
        json_data = response.json()
        response_data = MeResponse(**json_data)
        return response_data.ibm_extension.custom_attributes

    else:
        logger.error(f"Failed to retrieve profile. Response: {response.text}")
        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Not authenticated")
        else:
            json_data = response.json()
            error_details = json_data.get("detail")
            raise HTTPException(
                status_code=response.status_code, detail=f"HTTP error, {error_details}"
            )


async def get_custom_attribute(
    global_http_client: AsyncClient,
    user_access_token: str,
    custom_attribute: str,
):
    try:

        custom_attribute_List = await get_custom_attribute_List(
            global_http_client, user_access_token
        )
        logger.info(f"Custom Attributes List: {custom_attribute_List}")

        custom_attribute_value = get_attribute_value(
            custom_attribute_List, custom_attribute
        )
        logger.info(
            f"Custom Attribute {custom_attribute} value: {custom_attribute_value}"
        )

        return custom_attribute_value

    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")


async def patch_custom_attribute(
    global_http_client: AsyncClient,
    custom_attribute: str,
    user_token: str,
):
    try:

        settings = get_configuration()

        ibm_id = await get_ibm_id(user_token)

        access_token = await get_admin_token(global_http_client)

        users_api_endpoint = f"{settings.users_api_endpoint}/{ibm_id}"
        logger.info(f"API Endpoint: {users_api_endpoint}")

        headers = get_auth_request_headers(access_token, False)
        logger.info(f"headers: {headers}")

        # TODO: Replace Value, update to object class
        payload = {
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            "Operations": [
                {
                    "op": "add",
                    "path": "urn:ietf:params:scim:schemas:extension:ibm:2.0:User:customAttributes",
                    "value": [{"name": custom_attribute, "values": ["CUSTOM_VALUE"]}],
                }
            ],
        }

        logger.info(f"Json Payload: {payload}")

        response = await global_http_client.patch(
            users_api_endpoint,
            headers=headers,
            json=payload,
            follow_redirects=False,
            cookies={},
        )

        logger.info(f"Status code: {response.status_code}")
        logger.info(f"Response body: {response.text}")
        logger.info(f"Request headers: {response.request.headers}")
        logger.info(f"Request body: {response.request.content.decode()}")

        return response.status_code

    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")
