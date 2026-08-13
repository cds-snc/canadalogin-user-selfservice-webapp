from typing import Any

from httpx import AsyncClient
from pydantic import BaseModel

from app.config import get_configuration
from app.idv_data_store.services.in_person_operations import InPersonOperations
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


async def create_in_person_identity_verification_case(
    global_http_client: AsyncClient,
    user_access_token: str,
    payload: dict | None = None,
) -> ResponseModel:
    settings = get_configuration()
    operation = InPersonOperations(
        global_http_client,
        user_access_token,
        settings=settings,
    )
    result = await operation.send_code(payload)
    return _to_response_model(result)


async def get_last_email_sent(
    global_http_client: AsyncClient,
    user_access_token: str,
) -> ResponseModel:
    settings = get_configuration()
    operation = InPersonOperations(
        global_http_client,
        user_access_token,
        settings=settings,
    )
    result = await operation.get_last_email_sent()
    return _to_response_model(result)
