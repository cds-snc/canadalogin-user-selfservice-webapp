from urllib.parse import urlencode

from httpx import AsyncClient
from pydantic import TypeAdapter

from app.config import get_configuration
from app.identity_verification.schemas import IdentityDocument, IdentityDocumentType
from app.identity_verification.services.base_idv_data_store_service import (
    BaseIdvDataStoreService,
)
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel

_CONTEXT = "idv-data-store identity documents request"
_IDENTITY_DOCUMENTS_ADAPTER = TypeAdapter(list[IdentityDocument])


class IdentityDocumentsClient(BaseIdvDataStoreService):
    def __init__(self, http_client: AsyncClient, user_access_token: str, settings=None):
        super().__init__(http_client, user_access_token)
        self._settings = settings or get_configuration()

    async def list_documents(
        self, types: list[IdentityDocumentType] | None = None
    ) -> ResponseModel:
        endpoint = self._settings.idv_data_store_identity_documents_endpoint
        if types:
            endpoint = f"{endpoint}?{urlencode([('types', t.value) for t in types])}"
        print(":::::::::::::::::::::;::::::::::::::::::;::::::::::::::::::;::::::::::::::::::;::::::::::::::::::;Endpoint URL:", endpoint)
        response = await self._get(
            endpoint,
            scope=self._settings.idv_data_store_config.IDV_DATA_STORE_IDENTITY_DOCUMENTS_SCOPES,
            context=_CONTEXT,
        )

        print("WOWOWOWOWOOWOWOWOW", response.json())
        try:
            response.raise_for_status()
            documents = _IDENTITY_DOCUMENTS_ADAPTER.validate_python(response.json())
        except Exception as exc:
            RequestErrorHandler.handle(exc, context=_CONTEXT)
            raise

        return ResponseModel(
            success=True,
            message="Identity documents retrieved",
            data=[document.model_dump(mode="json") for document in documents],
        )


async def get_identity_documents(
    global_http_client: AsyncClient,
    user_access_token: str,
    types: list[IdentityDocumentType] | None = None,
) -> ResponseModel:
    client = IdentityDocumentsClient(
        global_http_client,
        user_access_token,
        settings=get_configuration(),
    )
    return await client.list_documents(types)
