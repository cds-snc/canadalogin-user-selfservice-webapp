import logging

from fastapi import APIRouter
from fastapi import Request, Depends

from app.constants.session_keys import SessionKeys
from app.auth.services.auth_user_session import get_users_current_session

from app.migration.services.link import callback
from app.migration.services.skip import skip_migration
from app.migration.services.utils import legacy_idp_auth_url, rp_auth_url

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get(
    "/utils/legacy_idp_auth_url/{client_id}",
    tags=["Migration"],
    summary="Legacy IDP Auth URL",
    description="Returns the legacy IDP OIDC authentication request url",
)
async def handle_legacy_idp_auth_url(
    request: Request,
    rp_client_id: str,
    user_access_token: str = Depends(get_users_current_session),
):
    return await legacy_idp_auth_url(
        request.app.state.request_client,
        rp_client_id,
        user_access_token,
    )


@router.get(
    "/utils/rp_auth_url/{client_id}",
    tags=["Migration"],
    summary="RP Auth URL",
    description="Returns the RP OIDC authentication request url",
)
async def handle_rp_auth_url(
    request: Request,
    rp_client_id: str,
    user_access_token: str = Depends(get_users_current_session),
):

    return await rp_auth_url(
        request.app.state.request_client,
        rp_client_id,
        user_access_token,
    )


@router.get(
    "/link/callback",
    tags=["Migration"],
    summary="Legacy IDP CallBack Endpoint",
    description="Handles the legacy IDP OIDC authentication callback",
)
async def handle_callback(
    request: Request,
    user_access_token: str = Depends(get_users_current_session),
):
    return await callback(
        request.app.state.request_client,
        user_access_token,
        request.session[SessionKeys.SESSION_USER_TOKEN.value],
    )


@router.get(
    "/skip",
    tags=["Migration"],
    summary="Skip Linking",
    description="User Skips the linking process",
)
async def handle_skip_migration(
    request: Request,
    user_access_token: str = Depends(get_users_current_session),
):

    return await skip_migration()
