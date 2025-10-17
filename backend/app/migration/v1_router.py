import logging

from fastapi import APIRouter
from fastapi import Request, Depends

from app.constants.session_keys import SessionKeys
from app.auth.services.auth_user_session import get_users_current_session
from app.migration.services.custom_attributes import (
    get_custom_attribute,
    patch_custom_attribute,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get(
    "/customattributes/{custom_attribute}",
    tags=["Migration"],
    summary="Get custom attribute",
    description="Returns the custom attribute from IBM Verify",
)
async def handle_get_custom_attribute(
    request: Request,
    custom_attribute: str,
    user_access_token: str = Depends(get_users_current_session),
):
    return await get_custom_attribute(
        request.app.state.request_client,
        user_access_token,
        custom_attribute,
    )


@router.patch(
    "/customattributes/{custom_attribute}",
    tags=["Migration"],
    summary="patch custom attribute",
    description="Patches the custom attribute in IBM Verify",
)
async def handle_patch_custom_attribute(
    request: Request,
    custom_attribute: str,
):

    return await patch_custom_attribute(
        request.app.state.request_client,
        custom_attribute,
        request.session[SessionKeys.SESSION_USER_TOKEN.value],
    )
