import logging

from httpx import AsyncClient

from app.config import get_configuration
from app.idv_data_store.services.verified_claims import (
    exchange_token_for_idv_data_store,
    get_idv_data_store_client_token,
)
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def _dispatch_in_person_verification_request(
    global_http_client: AsyncClient,
    user_access_token: str,
    endpoint: str,
    context: str,
) -> ResponseModel:
    """Shared plumbing for the in-person-verification endpoints: exchange the
    user's access_token for one scoped to idv-data-store's in-person
    verification scope, obtain idv-data-store's own client token, then call
    the given idv-data-store endpoint with the exchanged access_token.

    idv-data-store's in-person-verification endpoints already respond with
    a body matching this app's ResponseModel shape (success/message/data),
    so the response is passed through as-is.
    """
    settings = get_configuration()
    idv_settings = settings.idv_data_store_config
    scope = idv_settings.IDV_DATA_STORE_IN_PERSON_VERIFICATION_SCOPES

    idv_scoped_access_token = await exchange_token_for_idv_data_store(
        global_http_client, user_access_token, scope=scope
    )
    idv_data_store_client_token = await get_idv_data_store_client_token(
        global_http_client, scope=scope
    )

    try:
        response = await global_http_client.post(
            endpoint,
            json={"access_token": idv_scoped_access_token},
            headers={
                "Authorization": f"Bearer {idv_data_store_client_token}",
                "Content-Type": "application/json",
            },
        )
        response.raise_for_status()
    except Exception as exc:
        RequestErrorHandler.handle(exc, context=context)

    return ResponseModel(**response.json())


async def send_in_person_verification_code(
    global_http_client: AsyncClient,
    user_access_token: str,
) -> ResponseModel:
    """End-to-end: exchange the user's access_token for one scoped to
    idv-data-store's in-person-verification scope, then trigger idv-data-store
    to generate a verification code and send it via GC Notify.
    """
    settings = get_configuration()
    return await _dispatch_in_person_verification_request(
        global_http_client,
        user_access_token,
        settings.idv_data_store_in_person_verification_send_endpoint,
        context="idv-data-store in-person verification send request",
    )


async def get_last_email_sent(
    global_http_client: AsyncClient,
    user_access_token: str,
) -> ResponseModel:
    """End-to-end: exchange the user's access_token for one scoped to
    idv-data-store's in-person-verification scope, then fetch the timestamp
    of the last in-person verification email sent to the user.
    """
    settings = get_configuration()
    return await _dispatch_in_person_verification_request(
        global_http_client,
        user_access_token,
        settings.idv_data_store_in_person_verification_last_email_endpoint,
        context="idv-data-store in-person verification last-email-sent request",
    )
