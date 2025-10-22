import logging

from fastapi import APIRouter
from fastapi import Request, Depends

from app.constants.session_keys import SessionKeys
from app.auth.services.auth_user_session import get_users_current_session
from app.migration.services.custom_attributes import (
    get_custom_attribute,
    patch_custom_attribute,
)
from app.migration.services.legacy_idp import (
    get_auth_url as get_legacy_auth_url,
    callback,
)
from app.migration.services.rp import (
    get_auth_url as get_rp_auth_url,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get(
    "/customattributes/{custom_attribute}",
    tags=["Migration"],
    summary="Get custom attribute",
    description="Returns the custom attribute (List) from IBM Verify",
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
    description="Patches (Appends) the custom attribute in IBM Verify",
)
async def handle_patch_custom_attribute(
    request: Request,
    custom_attribute: str,
    user_access_token: str = Depends(get_users_current_session),
):

    return await patch_custom_attribute(
        request.app.state.request_client,
        user_access_token,
        request.session[SessionKeys.SESSION_USER_TOKEN.value],
        custom_attribute,
    )


@router.get(
    "/legacy_idp/auth_url/{rp_client_id}",
    tags=["Migration"],
    summary="Legacy IDP Auth URL",
    description="Returns the legacy IDP OIDC authentication request url",
)
async def handle_get_legacy_auth_url(
    request: Request,
    rp_client_id: str,
    user_access_token: str = Depends(get_users_current_session),
):

    return await get_legacy_auth_url(
        request.app.state.request_client,
        rp_client_id,
        user_access_token,
    )


@router.post(
    "/legacy_idp/callback",
    tags=["Migration"],
    summary="Legacy IDP CallBack Endpoint",
    description="Handles the legacy IDP OIDC authentication callback",
)
async def handle_rp_callback(
    request: Request,
):
    return await callback()


@router.get(
    "/rp/auth_url/{client_id}",
    tags=["Migration"],
    summary="RP Auth URL",
    description="Returns the RP OIDC authentication request url",
)
async def handle_get_rp_auth_url(
    request: Request,
    rp_client_id: str,
    user_access_token: str = Depends(get_users_current_session),
):

    return await get_rp_auth_url(
        request.app.state.request_client,
        rp_client_id,
        user_access_token,
    )
