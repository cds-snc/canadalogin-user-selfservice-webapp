import logging
from typing import Optional

from fastapi import APIRouter, Depends, Request, status
from app.auth.services.auth_user_session import get_users_current_session
from app.utils.schemas import ResponseModel
from app.identity_verification.schemas import StoreTargetUrlRequest
from app.identity_verification.services.create_identity_verification import (
    idv_mock_success_response,
    create_identity_verification,
)
from app.idv_data_store.services.in_person_verification import (
    send_in_person_verification_code,
    get_last_email_sent,
)
from app.identity_verification.services.redirect_target_url import (
    get_identity_verification_redirect_url,
    store_identity_verification_target_url,
)
from app.identity_verification.schemas import (
    CreateIdentityVerificationResponse,
    CreateOnlineIdentityVerificationRequest,
)

from app.identity_verification.services.online_identity_verification import (
    create_online_identity_verification,
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
        request.app.state.request_client,
        user_access_token,
    )


@router.get(
    "/in-person/last-email-sent",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    tags=["Identity Verification"],
    summary="Get the last email sent date for in-person verification",
    description="Returns the timestamp of the last in-person verification email sent to the user.",
)
async def get_in_person_last_email_sent(
    request: Request,
    user_access_token: str = Depends(get_users_current_session),
):
    return await get_last_email_sent(
        request.app.state.request_client, user_access_token
    )


@router.post(
    "/target-url",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    tags=["Identity Verification"],
    summary="Store the relying party target URL for the current IDV session",
    description="Stores the RP target URL in the Redis-backed session so the user can be returned after completing identity verification.",
)
async def store_target_url(
    request: Request,
    payload: StoreTargetUrlRequest,
    user_access_token: str = Depends(get_users_current_session),
):
    return await store_identity_verification_target_url(request, payload.target_url)


@router.get(
    "/target-url",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    tags=["Identity Verification"],
    summary="Get the post-IDV redirect URL",
    description="Returns the redirect URL the user should be sent to after confirming identity details.",
)
async def get_target_url(
    request: Request,
    user_access_token: str = Depends(get_users_current_session),
):
    return await get_identity_verification_redirect_url(request)


@router.post(
    "/online",
    response_model=CreateIdentityVerificationResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Verifications"],
    summary="Create Online Identity Verification Case",
    description="Creates an online identity verification case and returns the browser start URL.",
)
async def create_online_identity_verification_case(
    request: Request,
    payload: Optional[CreateOnlineIdentityVerificationRequest] = None,
    user_access_token: str = Depends(get_users_current_session),
):
    return await create_online_identity_verification(
        request.app.state.request_client,
        user_access_token,
        required_by_rp_client_id=(
            payload.required_by_rp_client_id if payload is not None else None
        ),
    )
