import logging

from fastapi import APIRouter, Path
from fastapi import Request

from app.users.schemas import (
    ProfileUserData,
    ProfileResponse,
)
from app.users.services.profile import create_profile, get_profile

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/users/{user_id}/profile",
    response_model=ProfileResponse,
    tags=["Users"],
    summary="Create user profile in verify",
    description="",
)
async def user_create_profile(user_id, user_data: ProfileUserData, request: Request):
    return await create_profile(user_id, user_data, request.app.state.request_client)


@router.get(
    "/users/{user_id}/profile/",
    response_model=ProfileResponse,
    tags=["Users"],
    summary="Get a single user's profile",
    description="",
)
async def user_get_profile(
    request: Request, user_id: str = Path(..., description="User ID")
):
    return await get_profile(request.app.state.request_client, user_id)
