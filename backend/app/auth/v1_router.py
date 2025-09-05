import logging

from fastapi import APIRouter
from fastapi import Request, Depends
from app.auth.services.auth import (
    redirect_user_to_idp_verify,
    callback_handler,
    reauthenticate_user,
    backchannel_logout as backchannel_logout_service,
    logout_user,
    session_event_sse_generator,
)

from app.auth.services.auth_user_session import (
    get_users_current_session,
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
async def redirect_url(request: Request):
    return await redirect_user_to_idp_verify(request)


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


@router.get(
    "/logout",
    tags=["Auth"],
    summary="Logout user",
    description="",
)
async def logout(request: Request):
    return await logout_user(request)


@router.get(
    "/keep-alive",
    tags=["Auth"],
    summary="Keep alive",
    description="",
)
async def keep_alive():
    return {"status": "ok"}


@router.post("/backchannel-logout")
async def backchannel_logout(request: Request):
    return await backchannel_logout_service(request)


# Server Side Event send session status message
# return stream Event
@router.get("/session-status")
async def session_status(request: Request):
    return await session_event_sse_generator(request)
