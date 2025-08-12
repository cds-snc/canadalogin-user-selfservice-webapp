import logging

from fastapi import APIRouter
from fastapi import Request, Depends
from app.auth.services.auth import redirect_to_verify, callback_handler, reauthenticate_user, get_users_current_session
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
    return await redirect_to_verify(request)


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
async def reauth(request: Request, returnToPage: str = "/", user_access_token: None = Depends(get_users_current_session)):
    return await reauthenticate_user(request, returnToPage)
