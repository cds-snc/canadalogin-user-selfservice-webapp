import logging
from fastapi import HTTPException, Request
from httpx import Response

from app.users.schemas import RelyingPartyResponse, RelyingPartyInfo
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.request_error_handler import RequestErrorHandler
from app.constants.session_keys import SessionKeys

logger = logging.getLogger(__name__)


def loop_applications_for_rp_info(oidc_user_applications_response, client_id) -> RelyingPartyInfo:
    applications_list = oidc_user_applications_response.get("applications", [])
    return next(
        (
            app.get("links")[0]

            for app in applications_list
            if app.get("description") == client_id
            and isinstance(app.get('links'), list)
            and app.get('links')
        ),
        None,
    )


async def dispatch_get_oidc_user_applications(
    request: Request,
) -> Response:
    try:
        logger.info("dispatch_get_oidc_user_applications")
        access_token = await get_admin_token(request.app.state.request_client)
        headers = get_auth_request_headers(access_token, True)
        response = await request.app.state.request_client.get(
            request.app.state.config.rp_user_applications_api_endpoint, headers=headers
        )

        response.raise_for_status()
        logger.info("rp info returned successfully")
        return response

    except Exception as e:
        logger.error(f"Error dispatching dispatch_get_oidc_user_applications: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)


async def get_relying_party_info(
    request: Request
):
    try:
        logger.info("Get RP info")
        oidc_user_applications_response = await dispatch_get_oidc_user_applications(request)
        relying_party_client_id = request.session.get(SessionKeys.RP_CLIENT_ID_KEY.value)

        if not relying_party_client_id:
            logger.error("Relying party client ID not found in session")
            raise HTTPException(status_code=400, detail="RP Info not found")

        if oidc_user_applications_response.status_code != 200:
            logger.error(f"Failed to retrieve user applications: {oidc_user_applications_response.status_code}")
            raise HTTPException(status_code=oidc_user_applications_response.status_code, detail="Failed to retrieve user applications")

        logger.info("List of RP applications retrieved successfully.")
        oidc_user_applications_response_json = oidc_user_applications_response.json()
        rp_info = loop_applications_for_rp_info(oidc_user_applications_response_json, relying_party_client_id)

        if not rp_info:
            logger.error(f"Relying party with ID {relying_party_client_id} not found")
            raise HTTPException(status_code=404, detail="Relying party info not found")

        response_data = RelyingPartyInfo(**rp_info)
        logger.info(f"Relying party profile: {response_data}")
        return RelyingPartyResponse(
            success=True,
            message="RP Info retrieved successfully.",
            data=response_data,
        )

    except Exception as e:
        logger.error(f"Error dispatching update_user_profile: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)
