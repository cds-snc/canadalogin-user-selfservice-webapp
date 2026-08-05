import logging

from httpx import AsyncClient

from app.config import get_configuration
from app.utils.request_error_handler import RequestErrorHandler

logger = logging.getLogger(__name__)


async def exchange_token_for_idv_data_store(
    global_http_client: AsyncClient,
    user_access_token: str,
    scope: str,
) -> str:
    """RFC 8693 OAuth 2.0 Token Exchange against IBM Verify.

    Exchanges the user's own access_token (issued to this app's OIDC
    client) for a new access_token scoped only to idv-data-store, using a
    dedicated IBM Verify STS client whose "Custom scopes and API access"
    configuration is restricted to only ever mint the requested delegated
    scope for the target idv-data-store endpoint. IBM Verify
    has no `resource`/`audience` request parameter; this scope restriction
    on the STS client is what plays that role.

    The user's original, broadly-scoped access_token is never shared with
    idv-data-store - only this narrowly-scoped, exchanged access_token is.

    `scope` is supplied by the calling flow.
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
        "scope": scope,
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
