import logging
import secrets
from typing import Any, Optional
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


def _get_idv_settings():
    """Fetch IDV data store configuration settings.

    Returns:
        IdvDataStoreConfig object with all IDV-related configuration
    """
    return get_configuration().idv_data_store_config


def _resolve_online_verification_url(response_data: dict[str, Any]) -> dict[str, Any]:
    """Prepend the IDV data store base URL to a relative online_verification_url path.

    The IDV data store returns relative URLs that must be joined with the base URL
    to create complete, usable verification URLs for the client.

    Args:
        response_data: Response dictionary potentially containing online_verification_url

    Returns:
        Modified response_data with resolved online_verification_url, or unchanged if no URL present
    """
    idv_verification_url = response_data.get("online_verification_url")
    if idv_verification_url:
        idv_settings = _get_idv_settings()
        resolved = urljoin(
            f"{idv_settings.IDV_DATA_STORE_BASE_URL.rstrip('/')}/",
            idv_verification_url.lstrip("/"),
        )
        logger.info("Resolved online_verification_url to: %s", resolved)
        response_data["online_verification_url"] = resolved
    return response_data


async def _post_online_verification_request(
    global_http_client: AsyncClient,
    user_access_token: str,
    endpoint: str,
    context: str,
    payload: Optional[dict[str, Any]] = None,
):
    """Execute an HTTP POST request to an IDV data store endpoint.

    Performs RFC 8693 OAuth 2.0 Token Exchange to obtain an IDV-scoped access token,
    then makes the upstream request with proper headers including an idempotency key
    for safe retry semantics.

    Args:
        global_http_client: Shared AsyncClient for making HTTP requests
        user_access_token: User's access token from IBM Verify
        endpoint: Full URL of the IDV endpoint to call
        context: Context string for error logging and reporting
        payload: Optional JSON payload for the request body

    Returns:
        httpx.Response object with status code and raw response body

    Raises:
        HTTPException: Converted from any RequestError via RequestErrorHandler
    """
    online_scope = _get_idv_settings().IDV_DATA_STORE_ONLINE_VERIFICATION_SCOPES
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
    """Create a new online identity verification case for the user.

    Initiates the online identity verification flow. If an open case already
    exists for the user (409 conflict), automatically reissues the existing
    session instead of creating a duplicate.

    Args:
        global_http_client: Shared AsyncClient for making HTTP requests
        user_access_token: User's access token from IBM Verify
        required_by_rp_client_id: Optional RP client ID to associate with the case

    Returns:
        CreateIdentityVerificationResponse with case ID, status, and browser start URL
    """
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

    # Handle 409 Conflict: An open case already exists for this user
    if response.status_code == status.HTTP_409_CONFLICT:
        try:
            body = response.json()
        except ValueError:
            body = {}

        detail = body.get("detail") if isinstance(body.get("detail"), dict) else {}
        if detail.get("error") == "open_case_exists":
            existing_case_id = detail.get("existing_case_id")
            if existing_case_id:
                logger.info(
                    "Open case exists for user, reissuing session for case_id: %s",
                    existing_case_id,
                )
                reissued_response = await reissue_online_session(
                    global_http_client,
                    user_access_token,
                    existing_case_id,
                )

                # Reissue flow already returns a validated model.
                return CreateIdentityVerificationResponse(
                    **reissued_response.model_dump()
                )

    # Raise exception for other errors (4xx, 5xx)
    try:
        response.raise_for_status()
    except Exception as exc:
        RequestErrorHandler.handle(exc, context="idv-data-store online verification create request")

    # Parse and resolve the response
    response_data = response.json()
    response_data = _resolve_online_verification_url(response_data)

    return CreateIdentityVerificationResponse(**response_data)


async def reissue_online_session(
    global_http_client: AsyncClient,
    user_access_token: str,
    case_id: str,
) -> ReissueOnlineSessionResponse:
    """Reissue an online verification session for an existing case.

    Generates a fresh browser start URL for a verification case that already exists,
    without creating a duplicate case. Used when a case exists but the user needs
    a new session link.

    Args:
        global_http_client: Shared AsyncClient for making HTTP requests
        user_access_token: User's access token from IBM Verify
        case_id: Unique identifier of the existing verification case

    Returns:
        ReissueOnlineSessionResponse with updated case details and new verification URL
    """
    settings = get_configuration()

    response = await _post_online_verification_request(
        global_http_client,
        user_access_token,
        settings.idv_data_store_online_session_endpoint(case_id),
        context="idv-data-store online verification reissue session request",
    )

    # Raise exception for errors (4xx, 5xx)
    response.raise_for_status()

    # Parse and resolve the response
    response_data = response.json()
    response_data = _resolve_online_verification_url(response_data)
    return ReissueOnlineSessionResponse(**response_data)
