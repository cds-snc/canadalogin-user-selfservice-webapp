from typing import Any

from pydantic import BaseModel
from httpx import AsyncClient

from app.idv_data_store.services.identity_data_service import (
    IdentityDataService,
)
from app.utils.schemas import ResponseModel


def _to_response_model(result: BaseModel) -> ResponseModel:
    data: Any = result.data
    if isinstance(data, BaseModel):
        data = data.model_dump()

    return ResponseModel(
        success=result.success,
        message=result.message,
        data=data,
    )


async def send_in_person_verification_code(
    global_http_client: AsyncClient,
    user_access_token: str,
) -> ResponseModel:
    service = IdentityDataService(global_http_client, user_access_token)
    result = await service.in_person().send_code()
    return _to_response_model(result)


async def get_last_email_sent(
    global_http_client: AsyncClient,
    user_access_token: str,
) -> ResponseModel:
    service = IdentityDataService(global_http_client, user_access_token)
    service.getClaims()
    result = await service.in_person().get_last_email_sent()
    return _to_response_model(result)
