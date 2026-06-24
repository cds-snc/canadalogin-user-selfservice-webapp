import logging

from fastapi import APIRouter, Depends, Request, status
from app.auth.services.auth_user_session import get_users_current_session
from app.utils.schemas import ResponseModel
from app.identity_verification.services.create_identity_verification import (
    idv_mock_success_response,
    create_identity_verification,
)
from app.identity_verification.services.send_in_person_verification_code import (
    send_in_person_verification_code,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
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


@router.get(
    "/online/mock-success-response",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    tags=["Identity Verification"],
    summary="Mock an IDV response for testing purposes",
    description="Generates a mock IDV response for online identity verification.",
)
async def idv_mock_success(
    request: Request,
    user_access_token: str = Depends(get_users_current_session),
):
    return await idv_mock_success_response(
        request.app.state.request_client, user_access_token
    )


@router.post(
    "/in-person",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    tags=["Identity Verification"],
    summary="Send an in-person identity verification code to the user",
    description="Sends an email via GC Notify containing a verification code the user must present at a Service Canada Centre.",
)
async def send_in_person_verification(
    request: Request,
    user_access_token: str = Depends(get_users_current_session),
):
    return await send_in_person_verification_code(
        request.app.state.request_client, user_access_token
    )
