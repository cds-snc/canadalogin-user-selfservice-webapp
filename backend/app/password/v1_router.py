import logging

from fastapi import APIRouter
from fastapi import Request, Depends
from app.auth.services.auth import (
    get_users_current_session,
)
from app.password.services.first_step_update_password import (
    first_step_update_password
)
from app.password.services.second_step_update_password import (
    second_step_update_password
)
from app.password.schemas import FirstStepPasswordUpdatePayload, SecondStepPasswordUpdatePayload, UpdatePasswordClientResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/update",
    tags=["Password"],
    summary="Update a users password",
    description="",
    response_model=UpdatePasswordClientResponse,
)
async def password_update(
    request: Request,
    payload: FirstStepPasswordUpdatePayload,
    user_access_token: None = Depends(get_users_current_session),
):
    return await first_step_update_password(
        request.app.state.request_client,
        payload,
    )


@router.post(
    "/update/otp",
    tags=["Password"],
    summary="Verify the OTP that was sent to the user",
    description="",
    response_model=UpdatePasswordClientResponse,
)
async def password_verify_otp(
    request: Request,
    payload: SecondStepPasswordUpdatePayload,
    user_access_token: None = Depends(get_users_current_session),
):
    return await second_step_update_password(
        request.app.state.request_client,
        payload,
    )
