"""
FIDO2 API router endpoints
"""

import logging
from fastapi import APIRouter, Depends, Request
from httpx import AsyncClient
from app.fido2.schemas import (
    FIDO2UserResponse,
    FIDO2UserResponseModel,
    FIDO2RegistrationResponseModel,
    DeleteRegistrationRequest,
    UpdateRegistrationRequest,
    FIDO2AttestationResultRequest,
    AttestationOptionsRequest,
    AssertionOptionsRequest,
    FIDO2AssertionResultRequest,
)
from app.utils.schemas import ResponseModel
from app.auth.services.auth_user_session import (
    get_users_current_session,
    get_http_client,
)

# Import individual service functions
from app.fido2.services.get_fido2_registrations import get_user_fido2_registrations
from app.fido2.services.get_registration_details import (
    get_registration_details as get_registration_details_service,
)
from app.fido2.services.delete_fido2_registration import (
    delete_registration as delete_registration_service,
)
from app.fido2.services.update_fido2_registration import (
    update_registration as update_registration_service,
)
from app.fido2.services.add_fido2_registration import (
    get_attestation_options as get_attestation_options_service,
    submit_attestation_result as submit_attestation_result_service,
)
from app.fido2.services.authenticate_fido2_registration import (
    get_assertion_options as get_assertion_options_service,
    submit_assertion_result as submit_assertion_result_service,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["fido2"])


@router.get(
    "/user",
    response_model=FIDO2UserResponseModel,
    summary="Get user FIDO2 credentials",
    description="Get the current user's FIDO2 credentials and authentication status",
)
async def get_user_fido2_credentials(
    user_access_token: str = Depends(get_users_current_session),
    http_client: AsyncClient = Depends(get_http_client),
):
    """
    Get user FIDO2 credentials - equivalent to sendUserResponse in JS.
    Returns user authentication status and list of registered FIDO2 credentials.
    """
    try:
        return await get_user_fido2_registrations(http_client, user_access_token)
    except Exception as e:
        logger.error(f"Error getting user FIDO2 credentials: {str(e)}")
        return FIDO2UserResponseModel(
            success=False,
            data=FIDO2UserResponse(authenticated=False),
            message="Failed to get user FIDO2 credentials",
        )


@router.get(
    "/registration/{registration_id}",
    response_model=FIDO2RegistrationResponseModel,
    summary="Get FIDO2 registration details",
    description="Get detailed information about a specific FIDO2 registration",
)
async def get_registration_details(
    registration_id: str,
    user_access_token: str = Depends(get_users_current_session),
    http_client: AsyncClient = Depends(get_http_client),
):
    """
    Get details of a specific FIDO2 registration - equivalent to registrationDetails in JS.
    Only returns registrations owned by the current user.
    """
    return await get_registration_details_service(
        http_client, user_access_token, registration_id
    )


@router.delete(
    "/registration",
    response_model=FIDO2UserResponseModel,
    summary="Delete FIDO2 registration",
    description="Delete a FIDO2 registration with FIDO2 verification and return updated user credentials",
)
async def delete_fido2_registration(
    request: Request,
    request_data: DeleteRegistrationRequest,
    user_access_token: str = Depends(get_users_current_session),
    http_client: AsyncClient = Depends(get_http_client),
):
    """
    Delete a FIDO2 registration with FIDO2 authentication verification.
    Requires FIDO2 assertion proof before deletion.
    Only allows deletion of registrations owned by the current user.
    Returns updated user credentials after deletion.
    """
    return await delete_registration_service(
        request, http_client, user_access_token, request_data
    )


@router.put(
    "/registration",
    response_model=FIDO2UserResponseModel,
    summary="Update FIDO2 registration",
    description="Update a FIDO2 registration (nickname, enabled status) and return updated user credentials",
)
async def update_fido2_registration(
    request_data: UpdateRegistrationRequest,
    user_access_token: str = Depends(get_users_current_session),
    http_client: AsyncClient = Depends(get_http_client),
):
    """
    Update a FIDO2 registration - allows updating nickname and enabled status.
    Only allows updating registrations owned by the current user.
    Returns updated user credentials after update.
    """
    return await update_registration_service(
        http_client, user_access_token, request_data
    )


@router.post(
    "/attestation/options",
    response_model=ResponseModel,
    summary="Get FIDO2 attestation options",
    description="Get attestation options for FIDO2 registration",
)
async def get_attestation_options(
    request_data: AttestationOptionsRequest,
    user_access_token: str = Depends(get_users_current_session),
    http_client: AsyncClient = Depends(get_http_client),
):
    """
    Get FIDO2 attestation options with server-side defaults.
    Used to start the FIDO2 registration process.
    """

    return await get_attestation_options_service(
        http_client=http_client,
        user_access_token=user_access_token,
        request_data=request_data,
    )


@router.post(
    "/attestation/result",
    response_model=ResponseModel,
    summary="Submit FIDO2 attestation result",
    description="Submit attestation result to complete FIDO2 registration",
)
async def submit_attestation_result(
    request_data: FIDO2AttestationResultRequest,
    user_access_token: str = Depends(get_users_current_session),
    http_client: AsyncClient = Depends(get_http_client),
):
    """
    Submit FIDO2 attestation result to IBM Verify.
    Used to complete the FIDO2 registration process.
    """
    return await submit_attestation_result_service(
        http_client=http_client,
        user_access_token=user_access_token,
        request_body=request_data.model_dump(),
    )


@router.post(
    "/assertion/options",
    response_model=ResponseModel,
    summary="Get FIDO2 assertion options",
    description="Get assertion options for FIDO2 authentication",
)
async def get_assertion_options(
    request_data: AssertionOptionsRequest,
    user_access_token: str = Depends(get_users_current_session),
    http_client: AsyncClient = Depends(get_http_client),
):
    """
    Get FIDO2 assertion options with server-side defaults.
    Used to start the FIDO2 authentication process.
    """
    return await get_assertion_options_service(
        http_client=http_client,
        user_access_token=user_access_token,
        request_data=request_data,
    )


@router.post(
    "/assertion/result",
    response_model=ResponseModel,
    summary="Submit FIDO2 assertion result",
    description="Submit assertion result to complete FIDO2 authentication",
)
async def submit_assertion_result(
    request: Request,
    request_data: FIDO2AssertionResultRequest,
    return_jwt: bool = False,
    user_access_token: str = Depends(get_users_current_session),
    http_client: AsyncClient = Depends(get_http_client),
):
    """
    Submit FIDO2 assertion result to IBM Verify.
    Used to complete the FIDO2 authentication process.

    Args:
        request: FastAPI Request for session storage
        request_data: Assertion result from the client
        return_jwt: If True, returns a JWT token that can be used for
                   step-up authentication with combined AMR claims.
                   The JWT will be automatically stored in the session
                   and exchanged for a combined token with password + FIDO2 AMR.
    """
    return await submit_assertion_result_service(
        request=request,
        http_client=http_client,
        user_access_token=user_access_token,
        request_body=request_data,
        return_jwt=return_jwt,
    )
