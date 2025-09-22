import logging

from fastapi import HTTPException, Request
from httpx import AsyncClient, Response
from pydantic import ValidationError

from app.users.schemas import (
    IBMVerifyUserProfileSchema,
    ProfileResponse,
    UserProfileUpdateRequest,
    IBMVerifyUpdateUserProfile,
    MetaDataTypeValue,
)
from app.utils.access_token import get_auth_request_headers
from app.utils.mask_phone_number import mask_phone_number
from app.config import get_configuration
from app.utils.request_error_handler import RequestErrorHandler

logger = logging.getLogger(__name__)


def sanitize_user_profile_data(user_data: UserProfileUpdateRequest) -> dict:
    # validation and then turns it into a UserProfileUpdateRequest dict
    validate_updated_data = UserProfileUpdateRequest(**user_data.model_dump())
    updated_data_dict = validate_updated_data.model_dump(
        exclude_unset=True, exclude_none=True
    )
    return updated_data_dict


def mask_contact_phone_numbers(
    phone_numbers: list[MetaDataTypeValue],
) -> list[MetaDataTypeValue]:
    """
    Loop through a list of profile contact phone numbers and mask each number except the last 4 digits.
    """

    if phone_numbers is None:
        return None

    formatted_numbers = []
    for phone in phone_numbers:
        value = phone.get("value")
        if not value:
            continue
        masked_phone = dict(phone)  # Create a copy of the original phone dict
        masked_phone["value"] = mask_phone_number(value)
        formatted_numbers.append(masked_phone)
    return formatted_numbers


async def dispatch_update_user_profile(
    request: Request,
    user_profile_payload: IBMVerifyUpdateUserProfile,
    user_access_token: str,
) -> Response:
    try:
        logger.info("dispatch_update_user_profile")
        headers = get_auth_request_headers(user_access_token)
        response = await request.app.state.request_client.put(
            request.app.state.config.profile_api_endpoint,
            content=user_profile_payload,
            headers=headers,
        )
        await response.raise_for_status()
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

        user_profile = await my_profile(
            request.app.state.request_client, user_access_token
        )
        user_profile_data = user_profile.data.model_dump()

        does_username_match = user_profile_data.get(
            "userName"
        ) == updated_user_data_dict.get("userName")

        if not does_username_match:
            logger.error("User mismatch - cannot update profile")
            raise HTTPException(
                status_code=403, detail="User mismatch - cannot update profile"
            )

        updated_user_data_dict.pop(
            "userName", None
        )  # Prevent changing the userName (email)

        merged_profile = {**user_profile_data, **updated_user_data_dict}

        validate_merged_profile = IBMVerifyUpdateUserProfile(**merged_profile)

        user_profile_payload = validate_merged_profile.model_dump_json(
            by_alias=True, exclude_none=True
        )

        response = await dispatch_update_user_profile(
            request, user_profile_payload, user_access_token
        )
        if response.status_code != 200:
            # parse error details safely
            json_data = response.json()
            error_detail = json_data.get("detail", "Unknown error")
            raise HTTPException(status_code=response.status_code, detail=error_detail)

        logger.info("User profile updated successfully.")
        json_data = response.json()
        response_data = IBMVerifyUserProfileSchema(**json_data)
        return ProfileResponse(
            success=True,
            message="User profile updated successfully.",
            data=response_data,
        )

    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")


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
        json_data = response.json()
        profile_contact_phone_numbers = json_data.get("phoneNumbers")
        if profile_contact_phone_numbers is not None:
            masked_contact_phone_numbers = mask_contact_phone_numbers(
                profile_contact_phone_numbers
            )
            json_data["phoneNumbers"] = masked_contact_phone_numbers

        response_data = IBMVerifyUserProfileSchema(**json_data)
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
            json_data = response.json()
            error_details = json_data.get("detail")
            raise HTTPException(
                status_code=response.status_code, detail=f"HTTP error, {error_details}"
            )
