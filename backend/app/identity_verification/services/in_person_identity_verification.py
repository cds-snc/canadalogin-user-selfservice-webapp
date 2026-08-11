import logging
from uuid import uuid4

from httpx import AsyncClient

from app.config import get_configuration
from app.idv_data_store.services.verified_claims import (
    exchange_token_for_idv_data_store,
)
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def _post_to_idv_data_store(
    global_http_client: AsyncClient,
    endpoint: str,
    **request_kwargs,
):
    """POST to idv-data-store with optional local TLS verification bypass."""
    settings = get_configuration()
    if settings.idv_data_store_config.IDV_DATA_STORE_DISABLE_TLS_VERIFY:
        async with AsyncClient(
            verify=False, timeout=global_http_client.timeout
        ) as client:
            return await client.post(endpoint, **request_kwargs)
    return await global_http_client.post(endpoint, **request_kwargs)


async def create_in_person_identity_verification_case(
    global_http_client: AsyncClient,
    user_access_token: str,
    payload: dict | None = None,
) -> ResponseModel:
    """Create an in-person identity verification case in idv-data-store.

    The upstream endpoint now owns both case creation and code delivery. For
    compatibility with existing resend flows, a minimal Service Canada payload
    is used when no applicant payload is provided by the caller.
    """
    settings = get_configuration()
    idv_settings = settings.idv_data_store_config
    scope = idv_settings.IDV_DATA_STORE_IDENTITY_VERIFICATION_SCOPES

    idv_scoped_access_token = await exchange_token_for_idv_data_store(
        global_http_client, user_access_token, scope=scope
    )

    request_body = dict(payload) if payload else {}
    request_body.setdefault("verification_provider", "service_canada")
    request_body.setdefault("applicant", {})

    try:
        response = await _post_to_idv_data_store(
            global_http_client,
            settings.idv_data_store_identity_verification_in_person_endpoint,
            headers={
                "Authorization": f"Bearer {idv_scoped_access_token}",
                "Accept": "application/json",
                "Idempotency-Key": str(uuid4()),
            },
            json=request_body,
        )
        response.raise_for_status()
    except Exception as exc:
        RequestErrorHandler.handle(
            exc,
            context="idv-data-store in-person identity verification create request",
        )

    response_data = response.json()

    return ResponseModel(
        success=True,
        message="In-person identity verification case created",
        data={
            "case_id": response_data.get("case_id"),
            "status": response_data.get("status"),
            "verification_code": response_data.get("verification_code_display"),
            "verification_expires_at": response_data.get("expires_at"),
        },
    )


async def get_last_email_sent(
    global_http_client: AsyncClient,
    user_access_token: str,
) -> ResponseModel:
    """Fetch the timestamp of the last in-person verification email sent."""
    settings = get_configuration()
    idv_settings = settings.idv_data_store_config
    scope = idv_settings.IDV_DATA_STORE_IN_PERSON_VERIFICATION_SCOPES

    idv_scoped_access_token = await exchange_token_for_idv_data_store(
        global_http_client, user_access_token, scope=scope
    )

    try:
        response = await _post_to_idv_data_store(
            global_http_client,
            settings.idv_data_store_in_person_verification_last_email_endpoint,
            headers={
                "Authorization": f"Bearer {idv_scoped_access_token}",
                "Accept": "application/json",
            },
        )
        response.raise_for_status()
    except Exception as exc:
        RequestErrorHandler.handle(
            exc,
            context="idv-data-store in-person verification last-email-sent request",
        )

    return ResponseModel(**response.json())
