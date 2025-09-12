import logging

from fastapi import HTTPException, Request
from httpx import AsyncClient
from pydantic import ValidationError

from app.users.schemas import IBMVerifyUserProfileSchema, ProfileResponse, UserProfileUpdateRequest, IBMVerifyUpdateUserProfile
from app.utils.access_token import get_auth_request_headers
from app.config import get_configuration
from backend.app.utils.request_error_handler import RequestErrorHandler

logger = logging.getLogger(__name__)


def sanitize_user_profile_data(user_data: UserProfileUpdateRequest) -> dict:
    validate_updated_data = UserProfileUpdateRequest(**user_data.model_dump())  # validation and then turns it into a UserProfileUpdateRequest data object
    updated_data_dict = validate_updated_data.model_dump(exclude_unset=True, exclude_none=True)
    return updated_data_dict


async def dispatch_update_user_profile(
    request: Request,
    user_data: IBMVerifyUpdateUserProfile,
    user_access_token: str,
):
    try:
        headers = get_auth_request_headers(user_access_token)
        response = await request.app.state.request_client.put(
            request.app.state.config.profile_api_endpoint, content=user_data, headers=headers
        )
        response.raise_for_status()
        logger.info("updating user profile changes returned successfully")
        return response

    except Exception as e:
        logger.error(f"Error dispatching update_user_profile: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)


async def update_profile(
    request: Request,
    user_data: UserProfileUpdateRequest,
    user_access_token,
):
    try:

        updated_user_data_dict = sanitize_user_profile_data(user_data)

        user_profile = await my_profile(request.app.state.request_client, user_access_token)
        user_profile_data = user_profile.data.model_dump()
        updated_user_data_dict.pop("userName", None)  # Prevent changing the userName (email)

        merged_profile = {**user_profile_data, **updated_user_data_dict}

        validate_merged_profile = IBMVerifyUpdateUserProfile(**merged_profile)

        validated_data = validate_merged_profile.model_dump_json(
            by_alias=True, exclude_none=True
        )

        response = await dispatch_update_user_profile(request, validated_data, user_access_token)
    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")

    if response.status_code == 200:
        logger.info("User profile updated successfully.")
        response_data = IBMVerifyUserProfileSchema(**response.json())
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
        response_data = IBMVerifyUserProfileSchema(**response.json())
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
