import logging
import json
from pydantic import ValidationError
from fastapi import HTTPException
from httpx import AsyncClient
from app.users.services.create import get_auth_request_headers, get_admin_token
from app.config import get_settings
from app.users.schemas import (
    ProfileUserData,
    ProfileCreateRequest,
    Operations,
    ProfileGetResponseData,
    ProfileResponse,
    PasswordChangeRequest,
)

logger = logging.getLogger(__name__)


async def create_manage_profile(
    user_id, user_data: ProfileUserData, global_http_client: AsyncClient
):
    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token)
        settings = get_settings().ibm_verify_config
        userid = user_id
        create_profile_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/Users/{userid}"
        first_name = user_data.firstName
        last_name = user_data.lastName
        preferred_language = user_data.preferredLanguage
        formatted_name = f"{first_name} {last_name}" if first_name else last_name
        mobile_number = user_data.mobileNumber
        work_number = user_data.workNumber

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
            Operations(op="replace", path="phoneNumbers.mobile", value=mobile_number),
        ]
        if first_name:
            operation_list.append(
                Operations(op="replace", path="name.givenName", value=first_name)
            )
        if work_number:
            operation_list.append(
                Operations(op="replace", path="phoneNumbers.work", value=work_number),
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
        get_response = await get_profile(
            global_http_client=global_http_client, user_id=user_id
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


async def update_password(
    access_token, user_data: PasswordChangeRequest, global_http_client: AsyncClient
):
    settings = get_settings().ibm_verify_config
    update_password_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/Me/password"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "schemas": [
            "urn:ietf:params:scim:schemas:ibm:core:2.0:ChangePassword",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification",
        ],
        "currentPassword": user_data.current_password,
        "newPassword": user_data.new_password,
        "urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification": {
            "notifyType": "NONE"
        },
    }

    response = await global_http_client.put(
        update_password_url, json=payload, headers=headers
    )

    if response.status_code == 200:
        return {"message": "Password updated successfully"}
    else:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.json().get("message", "Failed to update password"),
        )
