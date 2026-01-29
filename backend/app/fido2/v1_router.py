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
    FIDO2AssertionOptionsRequest,
    FIDO2AssertionResultRequest,
)
from app.utils.schemas import ResponseModel
from app.auth.services.auth_user_session import (
    get_users_current_session,
    get_http_client,
)

# Import individual service functions
from app.fido2.services.get_fido2_registrations import get_user_response
from app.fido2.services.get_registration_details import (
    get_registration_details as get_registration_details_service,
)
from app.fido2.services.delete_fido2_registration import (
    delete_registration as delete_registration_service,
)
from app.fido2.services.update_fido2_registration import (
    update_registration as update_registration_service,
)
from app.fido2.services.proxy_fido2_request import proxy_fido2_request
from app.fido2.services.validate_fido2_login import validate_fido2_login

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
        return await get_user_response(http_client, user_access_token)
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
    description="Delete a FIDO2 registration and return updated user credentials",
)
async def delete_fido2_registration(
    request_data: DeleteRegistrationRequest,
    user_access_token: str = Depends(get_users_current_session),
    http_client: AsyncClient = Depends(get_http_client),
):
    """
    Delete a FIDO2 registration - equivalent to deleteRegistration in JS.
    Only allows deletion of registrations owned by the current user.
    Returns updated user credentials after deletion.
    """
    return await delete_registration_service(
        http_client, user_access_token, request_data
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
    user_access_token: str = Depends(get_users_current_session),
    http_client: AsyncClient = Depends(get_http_client),
):
    """
    Get FIDO2 attestation options with server-side defaults.
    Used to start the FIDO2 registration process.
    """
    # Set proper defaults for FIDO2 attestation
    request_body = {
        "attestation": "direct",
        "authenticatorSelection": {
            "requireResidentKey": False,
            "userVerification": "preferred",
        },
    }

    return await proxy_fido2_request(
        http_client=http_client,
        user_access_token=user_access_token,
        endpoint_path="/attestation/options",
        request_body=request_body,
        validate_username=True,
        allow_empty_username=True,
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
    Proxy FIDO2 attestation result request to IBM Verify.
    Used to complete the FIDO2 registration process.
    """
    return await proxy_fido2_request(
        http_client=http_client,
        user_access_token=user_access_token,
        endpoint_path="/attestation/result",
        request_body=request_data.model_dump(),
        validate_username=True,
        allow_empty_username=True,
    )


@router.post(
    "/assertion/options",
    response_model=ResponseModel,
    summary="Get FIDO2 assertion options",
    description="Get assertion options for FIDO2 authentication",
)
async def get_assertion_options(
    request_data: FIDO2AssertionOptionsRequest,
    user_access_token: str = Depends(get_users_current_session),
    http_client: AsyncClient = Depends(get_http_client),
):
    """
    Proxy FIDO2 assertion options request to IBM Verify.
    Used to start the FIDO2 authentication process.
    """
    return await proxy_fido2_request(
        http_client=http_client,
        user_access_token=user_access_token,
        endpoint_path="/assertion/options",
        request_body=request_data.model_dump(),
        validate_username=True,
        allow_empty_username=True,
    )


@router.post(
    "/assertion/result",
    response_model=FIDO2UserResponseModel,
    summary="Submit FIDO2 assertion result",
    description="Submit assertion result to complete FIDO2 authentication and login",
)
async def submit_assertion_result(
    request_data: FIDO2AssertionResultRequest,
    request: Request,
    http_client: AsyncClient = Depends(get_http_client),
):
    """
    Validate FIDO2 assertion result and complete login.
    Equivalent to validateFIDO2Login in JS.
    """
    try:
        user_response = await validate_fido2_login(
            http_client, request_data.model_dump()
        )

        # Store user session data
        if user_response.authenticated and user_response.username:
            request.session["username"] = user_response.username
            request.session["userDisplayName"] = user_response.displayName
            # TODO: Store userSCIMId if needed

        return user_response

    except Exception as e:
        logger.error(f"Error validating FIDO2 login: {str(e)}")
        raise


# Additional endpoints for unauthenticated scenarios (like login flow)


@router.post(
    "/public/assertion/options",
    response_model=ResponseModel,
    summary="Get FIDO2 assertion options (public)",
    description="Get assertion options for FIDO2 authentication without requiring existing session",
)
async def get_assertion_options_public(
    request_data: FIDO2AssertionOptionsRequest,
    http_client: AsyncClient = Depends(get_http_client),
):
    """
    Public endpoint for FIDO2 assertion options - used during login flow.
    Does not require existing authentication.
    """
    return await proxy_fido2_request(
        http_client=http_client,
        user_access_token=None,
        endpoint_path="/assertion/options",
        request_body=request_data.model_dump(),
        validate_username=False,
    )


@router.post(
    "/public/assertion/result",
    response_model=FIDO2UserResponseModel,
    summary="Submit FIDO2 assertion result (public)",
    description="Submit assertion result to complete FIDO2 authentication during login",
)
async def submit_assertion_result_public(
    request_data: FIDO2AssertionResultRequest,
    request: Request,
    http_client: AsyncClient = Depends(get_http_client),
):
    """
    Public endpoint for FIDO2 assertion result - used during login flow.
    Does not require existing authentication.
    """
    try:
        user_response = await validate_fido2_login(
            http_client, request_data.model_dump()
        )

        # Store user session data upon successful login
        if user_response.authenticated and user_response.username:
            request.session["username"] = user_response.username
            request.session["userDisplayName"] = user_response.displayName
            # TODO: Store userSCIMId if needed

        return user_response

    except Exception as e:
        logger.error(f"Error validating FIDO2 login: {str(e)}")
        raise
