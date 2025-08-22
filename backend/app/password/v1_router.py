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

from app.password.services.third_step_update_password import (
    third_step_update_password
)

from app.password.schemas import FirstStepPasswordUpdatePayload, SecondStepPasswordUpdatePayload, UpdatePasswordClientResponse, ThirdStepPasswordUpdatePayload, CompleteUpdatePasswordClientResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/update/initiate",
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
    "/update/validate",
    tags=["Password"],
    summary="Validate the OTP that was sent to the user",
    description="",
    response_model=UpdatePasswordClientResponse,
)
async def password_validate_otp(
    request: Request,
    payload: SecondStepPasswordUpdatePayload,
    user_access_token: None = Depends(get_users_current_session),
):
    return await second_step_update_password(
        request.app.state.request_client,
        payload,
    )


@router.put(
    "/update/complete",
    tags=["Password"],
    summary="Final step to update the users password",
    description="",
    response_model=CompleteUpdatePasswordClientResponse,
)
async def password_complete(
    request: Request,
    payload: ThirdStepPasswordUpdatePayload,
    user_access_token: None = Depends(get_users_current_session),
):
    return await third_step_update_password(
        request.app.state.request_client,
        payload,
    )
