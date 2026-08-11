import logging
import secrets
from typing import Optional
from urllib.parse import urljoin
from fastapi import status
from httpx import AsyncClient


from app.config import get_configuration
from app.idv_data_store.services.verified_claims import (
    exchange_token_for_idv_data_store,
)
from app.utils.request_error_handler import RequestErrorHandler
from app.identity_verification.schemas import (
    CreateIdentityVerificationResponse,
    ReissueOnlineSessionResponse,
)

logger = logging.getLogger(__name__)


def _resolve_online_verification_url(base_url: str, response_data: dict) -> dict:
    """Prepend the IDV data store base URL to a relative online_verification_url path."""
    idv_verification_url = response_data.get("online_verification_url")
    if idv_verification_url:
        resolved = urljoin(f"{base_url.rstrip('/')}/", idv_verification_url.lstrip("/"))
        logger.info("Resolved online_verification_url to: %s", resolved)
        response_data["online_verification_url"] = resolved
    return response_data


async def _dispatch_online_verification_request(
    global_http_client: AsyncClient,
    user_access_token: str,
    endpoint: str,
    context: str,
    payload: Optional[dict] = None,
) -> dict:
    response = await _post_online_verification_request(
        global_http_client,
        user_access_token,
        endpoint,
        context,
        payload=payload,
    )

    response.raise_for_status()
    return response.json()


async def _post_online_verification_request(
    global_http_client: AsyncClient,
    user_access_token: str,
    endpoint: str,
    context: str,
    payload: Optional[dict] = None,
):
    settings = get_configuration()

    idv_settings = settings.idv_data_store_config
    online_scope = idv_settings.IDV_DATA_STORE_ONLINE_VERIFICATION_SCOPES

    idv_scoped_access_token = await exchange_token_for_idv_data_store(
        global_http_client, user_access_token, scope=online_scope
    )

    try:
        request_kwargs = {
            "headers": {
                "Authorization": f"Bearer {idv_scoped_access_token}",
                "Accept": "application/json",
                "Idempotency-Key": str(secrets.randbelow(10**16)),
            }
        }
        if payload is not None:
            request_kwargs["json"] = payload

        response = await global_http_client.post(endpoint, **request_kwargs)
    except Exception as exc:
        RequestErrorHandler.handle(exc, context=context)

    return response


async def create_online_identity_verification(
    global_http_client: AsyncClient,
    user_access_token: str,
    required_by_rp_client_id: Optional[str] = None,
) -> CreateIdentityVerificationResponse:
    settings = get_configuration()
    payload = {}
    if required_by_rp_client_id is not None:
        payload["required_by_rp_client_id"] = required_by_rp_client_id

    response = await _post_online_verification_request(
        global_http_client,
        user_access_token,
        settings.idv_data_store_online_verification_endpoint,
        context="idv-data-store online verification create request",
        payload=payload,
    )

    if response.status_code == status.HTTP_409_CONFLICT:
        try:
            body = response.json()
        except ValueError:
            body = {}

        detail = body.get("detail") if isinstance(body.get("detail"), dict) else {}
        if detail.get("error") == "open_case_exists":
            existing_case_id = detail.get("existing_case_id")
            if existing_case_id:
                reissued_response = await reissue_online_session(
                    global_http_client,
                    user_access_token,
                    existing_case_id,
                )
                return CreateIdentityVerificationResponse(
                    **reissued_response.model_dump()
                )

    response.raise_for_status()
    response_data = _resolve_online_verification_url(
        settings.idv_data_store_config.IDV_DATA_STORE_BASE_URL,
        response.json(),
    )
    return CreateIdentityVerificationResponse(**response_data)


async def reissue_online_session(
    global_http_client: AsyncClient,
    user_access_token: str,
    case_id: str,
) -> ReissueOnlineSessionResponse:
    settings = get_configuration()
    response_data = await _dispatch_online_verification_request(
        global_http_client,
        user_access_token,
        settings.idv_data_store_online_session_endpoint(case_id),
        context="idv-data-store online verification reissue session request",
    )
    response_data = _resolve_online_verification_url(
        settings.idv_data_store_config.IDV_DATA_STORE_BASE_URL,
        response_data,
    )
    return ReissueOnlineSessionResponse(**response_data)
