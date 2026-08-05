import logging

from httpx import AsyncClient

from app.config import get_configuration
from app.idv_data_store.services.token_exchange import (
    exchange_token_for_idv_data_store,
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
    verification scope, then call the given idv-data-store endpoint using the
    exchanged token directly as Authorization Bearer.

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

    try:
        response = await global_http_client.post(
            endpoint,
            headers={
                "Authorization": f"Bearer {idv_scoped_access_token}",
                "Accept": "application/json",
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
