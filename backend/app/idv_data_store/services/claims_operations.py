from app.config import get_configuration
from app.idv_data_store.services.base_idv_data_store_service import (
    BaseIdvDataStoreService,
)
from app.idv_data_store.services.schemas import ClaimsResponse
from app.utils.request_error_handler import RequestErrorHandler


class ClaimsOperations(BaseIdvDataStoreService):
    def __init__(self, http_client, user_access_token: str, settings=None):
        super().__init__(http_client, user_access_token)
        self._settings = settings or get_configuration()

    async def get(self) -> ClaimsResponse:
        response = await self._post(
            self._settings.idv_data_store_userinfo_endpoint,
            scope=self._settings.idv_data_store_config.IDV_DATA_STORE_AUTH_USERINFO_SCOPES,
            context="idv-data-store userinfo request",
        )

        try:
            response.raise_for_status()
        except Exception as exc:
            RequestErrorHandler.handle(exc, context="idv-data-store userinfo request")

        return ClaimsResponse(claims=response.json())
