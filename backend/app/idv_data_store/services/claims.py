from httpx import AsyncClient

from app.idv_data_store.client.storage_service.identity_data_service import (
    IdentityDataService,
)
from app.utils.schemas import ResponseModel


async def get_claims(
    global_http_client: AsyncClient,
    user_access_token: str,
) -> ResponseModel:
    service = IdentityDataService(global_http_client, user_access_token)
    result = await service.claims().get()
    return ResponseModel(
        success=True,
        message="Claims retrieved successfully",
        data=result.claims,
    )