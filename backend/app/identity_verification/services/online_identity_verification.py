from typing import Optional

from httpx import AsyncClient

from app.identity_verification.schemas import (
    CreateIdentityVerificationResponse,
    CreateOnlineIdentityVerificationRequest,
    ReissueOnlineSessionResponse,
)
from app.idv_data_store.services.identity_data_service import IdentityDataService


async def create_online_identity_verification(
    global_http_client: AsyncClient,
    user_access_token: str,
    required_by_rp_client_id: Optional[str] = None,
) -> CreateIdentityVerificationResponse:
    service = IdentityDataService(global_http_client, user_access_token)
    payload = CreateOnlineIdentityVerificationRequest(
        required_by_rp_client_id=required_by_rp_client_id,
    )
    return await service.create_identity_verification_case(payload)


async def reissue_online_session(
    global_http_client: AsyncClient,
    user_access_token: str,
    case_id: str,
) -> ReissueOnlineSessionResponse:
    service = IdentityDataService(global_http_client, user_access_token)
    return await service.online().reissue_session(case_id)
