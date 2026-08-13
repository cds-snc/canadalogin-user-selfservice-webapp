from typing import Any
from urllib.parse import urljoin

from app.config import get_configuration
from app.idv_data_store.services.base_idv_data_store_service import (
    BaseIdvDataStoreService,
)
from app.identity_verification.schemas import ReissueOnlineSessionResponse
from app.utils.request_error_handler import RequestErrorHandler


class OnlineOperations(BaseIdvDataStoreService):
    def __init__(self, http_client, user_access_token: str, settings=None):
        super().__init__(http_client, user_access_token)
        self._settings = settings or get_configuration()

    async def reissue_session(self, case_id: str) -> ReissueOnlineSessionResponse:
        response = await self._post(
            self._settings.idv_data_store_online_session_endpoint(case_id),
            scope=self._settings.idv_data_store_config.IDV_DATA_STORE_ONLINE_VERIFICATION_SCOPES,
            context="idv-data-store online verification reissue session request",
            include_idempotency_key=True,
        )

        try:
            response.raise_for_status()
        except Exception as exc:
            RequestErrorHandler.handle(
                exc,
                context="idv-data-store online verification reissue session request",
            )

        response_data = self.resolve_online_verification_url(response.json())
        return ReissueOnlineSessionResponse(**response_data)

    def resolve_online_verification_url(
        self,
        response_data: dict[str, Any],
    ) -> dict[str, Any]:
        idv_verification_url = response_data.get("online_verification_url")
        if idv_verification_url:
            idv_settings = self._settings.idv_data_store_config
            response_data["online_verification_url"] = urljoin(
                f"{idv_settings.IDV_DATA_STORE_BASE_URL.rstrip('/')}/",
                idv_verification_url.lstrip("/"),
            )
        return response_data
