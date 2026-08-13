from typing import Optional

from httpx import AsyncClient

from app.config import get_configuration
from app.identity_verification.schemas import (
    CreateIdentityVerificationResponse,
    ReissueOnlineSessionResponse,
)
from app.idv_data_store.services.online_operations import OnlineOperations


async def create_online_identity_verification(
    global_http_client: AsyncClient,
    user_access_token: str,
    required_by_rp_client_id: Optional[str] = None,
) -> CreateIdentityVerificationResponse:
    settings = get_configuration()
    operation = OnlineOperations(
        global_http_client,
        user_access_token,
        settings=settings,
    )
    payload = {}
    if required_by_rp_client_id is not None:
        payload["required_by_rp_client_id"] = required_by_rp_client_id
    return await operation.create_case(payload)


async def reissue_online_session(
    global_http_client: AsyncClient,
    user_access_token: str,
    case_id: str,
) -> ReissueOnlineSessionResponse:
    settings = get_configuration()
    operation = OnlineOperations(
        global_http_client,
        user_access_token,
        settings=settings,
    )
    return await operation.reissue_session(case_id)
