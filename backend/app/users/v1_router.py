import logging

from fastapi import APIRouter
from fastapi import Request, Depends

from app.users.schemas import (
    ProfileUserData,
    ProfileResponse,
)
from app.users.services.profile import create_profile, my_profile
from app.auth.services.auth import get_users_current_session

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/{user_id}/profile",
    response_model=ProfileResponse,
    tags=["Users"],
    summary="Create user profile in verify",
    description="",
)
async def user_create_profile(user_id, user_data: ProfileUserData, request: Request):
    return await create_profile(user_id, user_data, request.app.state.request_client)


@router.get(
    "/me",
    response_model=ProfileResponse,
    tags=["Users"],
    summary="Get a single user's profile",
    description="",
)
async def me(
    request: Request, user_access_token: str = Depends(get_users_current_session)
):
    return await my_profile(request.app.state.request_client, user_access_token)
