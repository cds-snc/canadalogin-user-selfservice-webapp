import logging
from typing import Optional
from fastapi import HTTPException, Request, status

from app.users.schemas import (
    IBMVerifyRelyingPartyUserApplicationsSchema,
    RelyingPartyResponse,
    RelyingPartyInfo,
)
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.request_error_handler import RequestErrorHandler
from app.constants.session_keys import SessionKeys

logger = logging.getLogger(__name__)


def get_rp_info_from_applications(
    oidc_user_applications_response: IBMVerifyRelyingPartyUserApplicationsSchema,
    client_id: str,
) -> Optional[RelyingPartyInfo]:
    applications_list = oidc_user_applications_response.applications
    for app in applications_list:
        if app.description == client_id:
            if hasattr(app, "links") and app.links and len(app.links) > 0:
                return RelyingPartyInfo(**app.links[0].model_dump())
    return None


async def dispatch_get_oidc_user_applications(
    request: Request,
) -> IBMVerifyRelyingPartyUserApplicationsSchema:
    logger.info("dispatch_get_oidc_user_applications")
    access_token = await get_admin_token(request.app.state.request_client)
    headers = get_auth_request_headers(access_token, True)
    response = await request.app.state.request_client.get(
        request.app.state.config.rp_user_applications_api_endpoint, headers=headers
    )

    response.raise_for_status()
    logger.info("rp info returned successfully")
    response_data = response.json()
    return IBMVerifyRelyingPartyUserApplicationsSchema(**response_data)


async def get_relying_party_info(request: Request):
    logger.info("Get RP info")
    relying_party_client_id = request.session.get(
        SessionKeys.RP_CLIENT_ID_KEY.value
    )
    if not relying_party_client_id:
        logger.info("Relying party client ID not found in session")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="RP Client ID not found"
        )
    ibm_verify_oidc_applications_response = (
        await dispatch_get_oidc_user_applications(request)
    )

    logger.info("List of RP applications retrieved successfully.")
    rp_info = get_rp_info_from_applications(
        ibm_verify_oidc_applications_response, relying_party_client_id
    )

    if not rp_info:
        logger.error(f"Relying party with ID {relying_party_client_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relying party info not found",
        )

    logger.info(f"Relying party profile: {rp_info}")
    return RelyingPartyResponse(
        success=True,
        message="RP Info retrieved successfully.",
        data=rp_info,
    )
