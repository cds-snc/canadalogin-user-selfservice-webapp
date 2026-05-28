import json
import logging
from typing import Optional
from fastapi import HTTPException, Request, status

from app.users.schemas import (
    IBMVerifyRelyingPartyUserApplicationsSchema,
    LocalizedRelyingPartyDetail,
    RelyingPartyResponse,
    RelyingPartyInfo,
)
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.constants.session_keys import SessionKeys

logger = logging.getLogger(__name__)


def _parse_localized_description(
    description: Optional[str], client_id: str
) -> tuple[bool, Optional[dict[str, LocalizedRelyingPartyDetail]]]:
    """Parse the description field which may contain localized RP info as JSON.

    Supports two formats:
      1. JSON with client_id as key: {"<client_id>": {"en": {...}, "fr": {...}}}
      2. Legacy plain text where description == client_id

    Returns a tuple of (matched, localized_dict).
    """
    if not description:
        return False, None

    # Legacy format: plain client_id string
    if description.strip() == client_id:
        return True, None

    try:
        parsed = json.loads(description)
    except (json.JSONDecodeError, TypeError):
        # May be missing outer braces, e.g. '"client_id": {...}' instead of '{"client_id": {...}}'
        try:
            parsed = json.loads("{" + description + "}")
        except (json.JSONDecodeError, TypeError):
            return False, None

    if not isinstance(parsed, dict):
        return False, None
    if client_id not in parsed:
        return False, None
    lang_data = parsed[client_id]
    if not isinstance(lang_data, dict):
        return False, None
    localized = {}
    for lang, details in lang_data.items():
        if isinstance(details, dict) and "name" in details and "url" in details:
            localized[lang] = LocalizedRelyingPartyDetail(**details)
    return True, localized if localized else None


def get_rp_info_from_applications(
    oidc_user_applications_response: IBMVerifyRelyingPartyUserApplicationsSchema,
    client_id: str,
) -> Optional[RelyingPartyInfo]:
    applications_list = oidc_user_applications_response.applications
    for app in applications_list:
        if not app.links or len(app.links) == 0:
            continue
        link = app.links[0]
        matched, localized = _parse_localized_description(app.description, client_id)
        if matched:
            link_data = link.model_dump()
            link_data["localized"] = localized
            return RelyingPartyInfo(**link_data)
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
    relying_party_client_id = request.session.get(SessionKeys.RP_CLIENT_ID_KEY.value)
    if not relying_party_client_id:
        logger.info("Relying party client ID not found in session")
        return None
    ibm_verify_oidc_applications_response = await dispatch_get_oidc_user_applications(
        request
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
