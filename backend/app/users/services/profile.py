import logging
import json
from pydantic import ValidationError
from fastapi import HTTPException
from httpx import AsyncClient
from app.users.services.create import get_auth_request_headers, get_admin_token
from app.config import get_settings
from app.users.schemas import (
    ProfileCreateResponse,
    ProfileUserData,
    ProfileCreateRequest,
    Operations,
)

logger = logging.getLogger(__name__)


async def create_profile(user_data: ProfileUserData, global_http_client: AsyncClient):
    try:
        access_token = await get_admin_token()
        headers = get_auth_request_headers(access_token)
        headers["Usershouldnotneedtoresetpassword"] = "false"
        settings = get_settings().ibm_verify_config
        user_id = user_data.userid
        create_profile_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/Users/{user_id}"
        first_name = user_data.firstName
        last_name = user_data.lastName
        formatted_name = f"{first_name} {last_name}" if first_name else last_name

        operation_list = [
            Operations(
                op="add",
                path="urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification:notifyType",
                value="NONE",
            ),
            Operations(op="replace", path="name.formatted", value=formatted_name),
            Operations(op="replace", path="name.familyName", value=last_name),
        ]
        if first_name:
            operation_list.append(
                Operations(op="replace", path="name.givenName", value=first_name)
            )
        create_request = ProfileCreateRequest(Operations=operation_list)
        # create_request.notification.notifyType = "NONE"
        request_json = create_request.model_dump()
        response = await global_http_client.patch(
            create_profile_url, json=request_json, headers=headers
        )

        if response.status_code == 204:
            logger.info("User profile created successfully.")
            return ProfileCreateResponse(
                success=True,
                status=str(200),
                message="User profile created successfully.",
            )
        else:
            try:
                response_json = response.json()
                error_message = response_json.get("detail")
            except Exception:
                error_message = response.text

            logger.error(f"Failed to create profile. Response: {error_message}")
            return ProfileCreateResponse(
                success=False, status=str(response.status_code), message=error_message
            )
    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        print(json.dumps(e.json(), indent=4))
        raise HTTPException(status_code=422, detail="Request data validation error")

    except HTTPException as he:
        logger.error(f"HTTP Exception in creating profile: {str(he)}")
        raise he
