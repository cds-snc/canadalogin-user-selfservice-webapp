import logging

from fastapi import APIRouter
from fastapi import Request, Depends
from app.auth.services.auth_user_session import get_users_current_session

from app.password.services.first_step_update_password import first_step_update_password
from app.password.services.second_step_update_password import (
    second_step_update_password,
)
from app.password.services.verify_password import verify_user_password

from app.password.services.third_step_update_password import third_step_update_password
from app.password.services.password_policy import get_password_policy


from app.password.schemas import (
    FirstStepPasswordUpdatePayload,
    PasswordPolicyResponse,
    SecondStepPasswordUpdatePayload,
    UpdatePasswordClientResponse,
    ThirdStepPasswordUpdatePayload,
    CompleteUpdatePasswordClientResponse,
    UserPassword,
    VerifiedUserPasswordResponse,
)

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
    # Extract language from payload instead of headers
    return await second_step_update_password(
        request.app.state.request_client,
        payload,
        payload.language,
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
        request.session,
        payload,
    )


@router.get(
    "/policy",
    response_model=PasswordPolicyResponse,
    response_model_exclude_none=True,
    summary="Get the password policy",
    description="Returns the password policy for the tenant",
)
async def password_policy(
    request: Request,
    user_access_token: None = Depends(get_users_current_session),
):
    """
    Get Password Policy from IBM Verify API.
    Returns: The password policy for the tenant
    """
    return await get_password_policy(request.app.state.request_client)


@router.post(
    "/verify",
    tags=["Password"],
    summary="Verify the users password",
    response_model=VerifiedUserPasswordResponse,
)
async def verify_user(
    request: Request,
    payload: UserPassword,
    user_access_token: str = Depends(get_users_current_session),
):
    return await verify_user_password(
        request,
        payload,
    )
