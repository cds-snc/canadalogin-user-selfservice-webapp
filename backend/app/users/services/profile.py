import logging

from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError

from app.users.schemas import ProfileGetResponseData, ProfileResponse, ProfilePUTData, ProfileUpdateData
from app.utils.access_token import get_auth_request_headers
from app.config import get_configuration

logger = logging.getLogger(__name__)


async def update_profile(
    global_http_client: AsyncClient,
    user_data: ProfilePUTData,
    user_access_token,
    profile_api_endpoint: str,
):
    try:
        headers = get_auth_request_headers(user_access_token)
        validate_updated_data = ProfilePUTData(
            **user_data.model_dump(exclude_unset=True)
        )  # validation and then turns it into a ProfilePUTData data object

        updated_data_dict = validate_updated_data.model_dump(exclude_unset=True, exclude_none=True)

        user_profile = await my_profile(global_http_client, user_access_token)
        user_profile_data = user_profile.data.model_dump()
        updated_data_dict.pop("userName", None)

        merged_profile = {**user_profile_data, **updated_data_dict}

        validate_merged_profile = ProfileUpdateData(**merged_profile)

        request_json = validate_merged_profile.model_dump_json(
            by_alias=True, exclude_none=True
        )

        print(request_json)
        response = await global_http_client.put(
            profile_api_endpoint, content=request_json, headers=headers
        )
    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")

    if response.status_code == 200:
        logger.info("User profile updated successfully.")
        response_data = ProfileGetResponseData(**response.json())
        return ProfileResponse(
            success=True,
            message="User profile updated successfully.",
            data=response_data,
        )
    else:
        if response.status_code == 401:
            logger.error("User is not authenticated.")
            raise HTTPException(status_code=401, detail="Not authenticated")
        logger.error(f"Failed to save profile. Response: {response.text}")
        error_details = response.json().get("detail")
        raise HTTPException(
            status_code=response.status_code, detail=f"HTTP error, {error_details}"
        )


async def my_profile(global_http_client: AsyncClient, user_access_token: str):
    try:
        settings = get_configuration()

        profile_api_endpoint = settings.profile_api_endpoint
        logger.info("Get my profile")
        headers = get_auth_request_headers(user_access_token)
        response = await global_http_client.get(profile_api_endpoint, headers=headers)
    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
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
        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Not authenticated")
        else:
            error_details = response.json().get("detail")
            raise HTTPException(
                status_code=response.status_code, detail=f"HTTP error, {error_details}"
            )
