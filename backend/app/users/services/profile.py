import json
import logging

from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError

from app.config import get_settings
from app.users.schemas import (
    ProfileUserData,
    ProfileCreateRequest,
    Operations,
    ProfileGetResponseData,
    ProfileResponse,
)
from app.utils.access_token import get_admin_token, get_auth_request_headers

logger = logging.getLogger(__name__)


async def update_profile(
    global_http_client: AsyncClient, user_data: ProfileGetResponseData, user_access_token
):
    try:
        admin_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(admin_token)
        settings = get_settings().ibm_verify_config
        userid = user_data.id
        create_profile_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/Users/{userid}"
        first_name = user_data.name.givenName
        last_name = user_data.name.familyName
        preferred_language = user_data.preferredLanguage
        formatted_name = user_data.name.formatted

        operation_list = [
            Operations(
                op="add",
                path="urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification:notifyType",
                value="NONE",
            ),
            Operations(op="replace", path="name.formatted", value=formatted_name),
            Operations(op="replace", path="name.familyName", value=last_name),
            Operations(
                op="replace", path="preferredLanguage", value=preferred_language
            ),
        ]
        if first_name:
            operation_list.append(
                Operations(op="replace", path="name.givenName", value=first_name)
            )
        create_request = ProfileCreateRequest(Operations=operation_list)
        request_json = create_request.model_dump()
        response = await global_http_client.patch(
            create_profile_url, json=request_json, headers=headers
        )
    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        print(json.dumps(e.json(), indent=4))
        raise HTTPException(status_code=422, detail="Request data validation error")

    if response.status_code == 204:
        logger.info("User profile created successfully.")
        get_response = await my_profile(
            global_http_client=global_http_client, user_access_token=user_access_token
        )
        get_dict = get_response.model_dump()
        logger.info(get_dict)
        return ProfileResponse(
            success=True,
            message="User profile created successfully.",
            data=ProfileGetResponseData(**get_dict["data"]),
        )
    else:
        logger.error(f"Failed to retrieve profile. Response: {response.text}")
        error_details = response.json().get("detail")
        raise HTTPException(
            status_code=response.status_code, detail=f"HTTP error, {error_details}"
        )


async def get_profile(global_http_client: AsyncClient, user_id: str):
    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token)
        settings = get_settings().ibm_verify_config
        get_profile_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/Users/{user_id}"
        response = await global_http_client.get(get_profile_url, headers=headers)
    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        print(json.dumps(e.json(), indent=4))
        raise HTTPException(status_code=422, detail="Request data validation error")

    if response.status_code == 200:
        logger.info("User profile retrieved successfully.")
        response_data = ProfileGetResponseData(**response.json())
        return ProfileResponse(
            success=True,
            message="User profile retrieved successfully.",
            data=response_data,
        )
    else:
        logger.error(f"Failed to retrieve profile. Response: {response.text}")
        error_details = response.json().get("detail")
        raise HTTPException(
            status_code=response.status_code, detail=f"HTTP error, {error_details}"
        )


async def my_profile(global_http_client: AsyncClient, user_access_token: str):
    try:
        logger.info("Get my profile")
        headers = get_auth_request_headers(user_access_token)
        settings = get_settings().ibm_verify_config
        get_profile_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/Me"
        response = await global_http_client.get(get_profile_url, headers=headers)
    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        print(json.dumps(e.json(), indent=4))
        raise HTTPException(status_code=422, detail="Request data validation error")

    if response.status_code == 200:
        logger.info("User profile retrieved successfully.")
        response_data = ProfileGetResponseData(**response.json())
        return ProfileResponse(
            success=True,
            message="User profile retrieved successfully.",
            data=response_data,
        )
    else:
        logger.error(f"Failed to retrieve profile. Response: {response.text}")
        if (response.status_code == 401):
            raise HTTPException(status_code=401, detail="Not authenticated")
        else:
            error_details = response.json().get("detail")
            raise HTTPException(
                status_code=response.status_code, detail=f"HTTP error, {error_details}"
            )
