import logging

from fastapi import APIRouter
from fastapi import Request, Depends

from app.users.schemas import ProfileResponse, ProfilePUTData
from app.users.services.profile import update_profile, my_profile
from app.auth.services.auth import get_users_current_session

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/profile",
    response_model=ProfileResponse,
    tags=["Users"],
    summary="Update a user profile in verify",
    description="",
)
async def user_profile(
    request: Request,
    user_data: ProfilePUTData,
    user_access_token: str = Depends(get_users_current_session),
):
    return await update_profile(
        request.app.state.request_client,
        user_data,
        user_access_token,
        profile_api_endpoint=request.app.state.config.profile_api_endpoint,
    )


@router.get(
    "/profile",
    response_model=ProfileResponse,
    tags=["Users"],
    summary="Get a single user's profile",
    description="",
)
async def profile(
    request: Request, user_access_token: str = Depends(get_users_current_session)
):
    return await my_profile(
        request.app.state.request_client,
        user_access_token,
        profile_api_endpoint=request.app.state.config.profile_api_endpoint,
    )
