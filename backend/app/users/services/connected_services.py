import json
import logging
from typing import Any

from fastapi import Request

from app.users.schemas import (
    ConnectedService,
    ConnectedServicesResponse,
    IBMVerifyRelyingPartyInfoSchema,
    IBMVerifyUserProfileSchema,
)
from app.users.services.get_my_profile import dispatch_get_my_profile_from_ibm
from app.users.services.rp_info import (
    _parse_localized_description,
    dispatch_get_oidc_user_applications,
)

logger = logging.getLogger(__name__)

PAIRWISE_ATTRIBUTE_NAME = "pairwiseIdPerClient"
UNKNOWN_SESSION_STATUS = "unknownSession"


def _parse_pairwise_values(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, dict):
        return [value]
    if isinstance(value, list):
        return [entry for entry in value if isinstance(entry, dict)]
    if not isinstance(value, str):
        return []

    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return []

    if isinstance(parsed, str):
        return _parse_pairwise_values(parsed)
    if isinstance(parsed, dict):
        return [parsed]
    if isinstance(parsed, list):
        return [entry for entry in parsed if isinstance(entry, dict)]
    return []


def _pairwise_client_ids(profile: IBMVerifyUserProfileSchema) -> set[str]:
    # /v2.0/Me is already scoped to the authenticated user, so every entry
    # under pairwiseIdPerClient belongs to them regardless of its "pai" value.
    custom_attributes = profile.details.customAttributes if profile.details else None
    if not custom_attributes:
        return set()

    client_ids: set[str] = set()
    for attribute in custom_attributes:
        if attribute.name.strip().lower() != PAIRWISE_ATTRIBUTE_NAME.lower():
            continue
        for value in attribute.values:
            for entry in _parse_pairwise_values(value):
                if isinstance(entry.get("clientId"), str):
                    client_ids.add(entry["clientId"])
    return client_ids


def _application_matches_client_id(
    application: IBMVerifyRelyingPartyInfoSchema, client_id: str
) -> bool:
    if application.id == client_id:
        return True
    matched, _ = _parse_localized_description(application.description, client_id)
    return matched


async def get_connected_services(request: Request, user_access_token: str):
    profile = await dispatch_get_my_profile_from_ibm(
        request.app.state.request_client, user_access_token
    )
    client_ids = _pairwise_client_ids(profile)
    if not client_ids:
        return ConnectedServicesResponse(services=[])

    applications = await dispatch_get_oidc_user_applications(
        request, user_access_token=user_access_token
    )
    services = []
    for application in applications.applications:
        matching_client_id = next(
            (
                client_id
                for client_id in client_ids
                if _application_matches_client_id(application, client_id)
            ),
            None,
        )
        if matching_client_id:
            services.append(
                ConnectedService(
                    clientId=matching_client_id,
                    name=application.name,
                    sessionStatus=UNKNOWN_SESSION_STATUS,
                )
            )

    logger.info(
        "Connected Services application count=%d matched count=%d",
        len(applications.applications),
        len(services),
    )
    return ConnectedServicesResponse(services=services)
