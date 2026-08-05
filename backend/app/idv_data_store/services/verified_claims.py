import logging

from httpx import AsyncClient

from app.config import get_configuration
from app.idv_data_store.services.token_exchange import exchange_token_for_idv_data_store
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def dispatch_get_verified_claims_from_idv_data_store(
    global_http_client: AsyncClient,
    idv_scoped_access_token: str,
) -> dict:
    """Call idv-data-store's POST /v1/auth/verified-claims with an already-exchanged
    access_token and return the verified identity claims.
    """
    settings = get_configuration()

    logger.info("Requesting verified identity claims from idv-data-store")
    try:
        response = await global_http_client.post(
            settings.idv_data_store_exchange_endpoint,
            headers={
                "Authorization": f"Bearer {idv_scoped_access_token}",
                "Accept": "application/json",
            },
        )
        response.raise_for_status()
    except Exception as exc:
        RequestErrorHandler.handle(
            exc, context="idv-data-store verified claims request"
        )

    return response.json()


async def get_verified_identity_claims(
    global_http_client: AsyncClient,
    user_access_token: str,
) -> ResponseModel:
    """End-to-end: exchange the user's access_token for one scoped to
    idv-data-store, then fetch and return their verified identity claims.
    """
    settings = get_configuration()
    scope = settings.idv_data_store_config.IDV_DATA_STORE_VERIFIED_CLAIMS_SCOPES

    idv_scoped_access_token = await exchange_token_for_idv_data_store(
        global_http_client, user_access_token, scope=scope
    )
    claims = await dispatch_get_verified_claims_from_idv_data_store(
        global_http_client, idv_scoped_access_token
    )

    return ResponseModel(
        success=True,
        message="Verified identity claims retrieved successfully",
        data=claims,
    )
