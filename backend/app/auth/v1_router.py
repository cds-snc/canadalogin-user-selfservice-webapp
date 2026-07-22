import logging

from typing import Optional
from fastapi import APIRouter
from fastapi import Request, Depends, Query
from app.auth.services.auth import (
    redirect_user_to_idp_verify,
    callback_handler,
    reauthenticate_user,
)
from app.auth.services.auth_user_session import (
    session_event_sse_generator,
)
from app.auth.services.auth_logout import (
    logout_user,
    backchannel_logout,
)

from app.auth.services.auth_user_session import (
    get_users_current_session,
    get_user_id_token,
    session_extend,
)

from app.constants.session_keys import SessionKeys

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get(
    "/login",
    tags=["Auth"],
    summary="Authenticate user via IBM Verify",
    description="",
)
async def redirect_url(
    request: Request,
    prompt: Optional[str] = Query(
        default=None, pattern="^(login|none|consent|select_account)$"
    ),
    returnToPage: Optional[str] = Query(default=None),
    partner: Optional[str] = Query(default=None),
):
    return await redirect_user_to_idp_verify(
        request,
        prompt=prompt,
        returnToPage=returnToPage,
        partner=partner,
    )


@router.get(
    "/callback",
    tags=["Auth"],
    summary="Callback from IBM Verify after user authentication",
    name=SessionKeys.CALLBACK_ROUTE_NAME.value,
    description="",
)
async def callback(request: Request):
    return await callback_handler(request)


@router.get(
    "/reauth",
    tags=["Auth"],
    summary="Reauthenticate user via IBM Verify",
    name="reauth",
    description="",
)
async def reauth(
    request: Request,
    returnToPage: str = "/",
    user_access_token: None = Depends(get_users_current_session),
):
    return await reauthenticate_user(request, returnToPage)


@router.post(
    "/logout",
    tags=["Auth"],
    summary="Logout user",
    description="",
)
async def logout(
    request: Request,
    returnToPage: Optional[str] = Query(default=None),
    id_token: str = Depends(get_user_id_token),
):
    return await logout_user(request, id_token, returnToPage=returnToPage)


@router.post(
    "/backchannel-logout",
    tags=["Auth"],
    summary="Backchannel logout",
    description="Allow GC Sign-In to call backchannel logout",
)
async def handle_backchannel_logout(request: Request):
    return await backchannel_logout(request)


@router.get(
    "/session-status",
    tags=["Auth"],
    summary="Session status",
    description="Get session status via Server-Sent Events (SSE)",
)
async def session_status(request: Request):
    return await session_event_sse_generator(request)


@router.post(
    "/keep-alive",
    tags=["Auth"],
    summary="Keep alive",
    description="Keep the user session alive and return the updated session expire info",
)
async def keep_alive(request: Request):
    return await session_extend(request)
