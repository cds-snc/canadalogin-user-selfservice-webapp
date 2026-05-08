import logging

from fastapi import APIRouter, Depends, Request, status
from app.auth.services.auth_user_session import get_users_current_session
from app.utils.schemas import ResponseModel
from app.identity_verification.services.create_identity_verification import create_identity_verification

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/online",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    tags=["Identity Verification"],
    summary="Starts the online Identity Verification process for a user ",
    description="Registering the user's email with Bluink and returning the Bluink redirect URL.",
)
async def user_identity_verification_registeration(
    request: Request,
    user_access_token: str = Depends(get_users_current_session),
):
    return await create_identity_verification(
        request.app.state.request_client, user_access_token
    )
