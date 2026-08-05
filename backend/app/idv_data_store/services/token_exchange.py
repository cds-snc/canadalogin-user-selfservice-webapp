import logging

from httpx import AsyncClient

from app.config import get_configuration
from app.utils.request_error_handler import RequestErrorHandler

logger = logging.getLogger(__name__)


async def exchange_token_for_idv_data_store(
    global_http_client: AsyncClient, user_access_token: str
) -> str:
    """RFC 8693 OAuth 2.0 Token Exchange against IBM Verify.

    Exchanges the user's own access_token (issued to this app's OIDC
    client) for a new access_token scoped only to idv-data-store, using a
    dedicated IBM Verify STS client whose "Custom scopes and API access"
    configuration is restricted to only ever mint the
    IDV_DATA_STORE_SCOPES ("idv:auth:verified-claims") scope. IBM Verify
    has no `resource`/`audience` request parameter; this scope restriction
    on the STS client is what plays that role.

    The user's original, broadly-scoped access_token is never shared with
    idv-data-store — only this narrowly-scoped, exchanged access_token is.
    """
    settings = get_configuration()
    idv_settings = settings.idv_data_store_config

    payload = {
        "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
        "client_id": idv_settings.IDV_DATA_STORE_STS_CLIENT_ID,
        "client_secret": idv_settings.IDV_DATA_STORE_STS_CLIENT_SECRET,
        "subject_token": user_access_token,
        "subject_token_type": "urn:ietf:params:oauth:token-type:access_token",
        "requested_token_type": "urn:ietf:params:oauth:token-type:access_token",
        "scope": idv_settings.IDV_DATA_STORE_SCOPES,
    }

    logger.info("Exchanging user access_token for an idv-data-store-scoped token")
    try:
        response = await global_http_client.post(
            settings.token_api_endpoint,
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        response.raise_for_status()
    except Exception as exc:
        RequestErrorHandler.handle(exc, context="IBM Verify token exchange")

    exchanged_access_token = response.json().get("access_token")
    if not exchanged_access_token:
        logger.error("Token exchange response did not contain an access_token")
        raise RequestErrorHandler.handle(
            ValueError("Missing access_token in token exchange response"),
            context="IBM Verify token exchange response",
        )
    logger.info("Token exchange for idv-data-store succeeded")
    return exchanged_access_token


async def get_idv_data_store_client_token(global_http_client: AsyncClient) -> str:
    """Obtain idv-data-store's own bootstrap-issued Bearer token.

    idv-data-store's protected endpoints (including POST /v1/auth/verified-claims)
    require a Bearer token issued by idv-data-store itself, scoped to
    idv:auth:verified-claims, identifying this app as a trusted registered client
    (see idv-data-store's POST /v1/admin/token). This is a separate
    credential system from the IBM Verify STS client used above.
    """
    settings = get_configuration()
    idv_settings = settings.idv_data_store_config

    logger.info("Requesting idv-data-store client token")
    try:
        response = await global_http_client.post(
            settings.idv_data_store_token_endpoint,
            params={
                "client_id": idv_settings.IDV_DATA_STORE_CLIENT_ID,
                "scopes": idv_settings.IDV_DATA_STORE_SCOPES,
            },
        )
        response.raise_for_status()
    except Exception as exc:
        RequestErrorHandler.handle(exc, context="idv-data-store client token request")

    client_token = response.json().get("access_token")
    if not client_token:
        logger.error("idv-data-store token response did not contain an access_token")
        raise RequestErrorHandler.handle(
            ValueError("Missing access_token in idv-data-store token response"),
            context="idv-data-store client token response",
        )
    return client_token
