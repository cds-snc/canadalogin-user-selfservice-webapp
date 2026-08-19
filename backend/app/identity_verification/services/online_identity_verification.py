import logging
from typing import Optional
from urllib.parse import urljoin

from httpx import AsyncClient
from fastapi import status

from app.config import get_configuration
from app.identity_verification.schemas import (
    CreateIdentityVerificationResponse,
    ReissueOnlineSessionResponse,
)
from app.identity_verification.services.base_idv_data_store_service import (
    BaseIdvDataStoreService,
)
from app.utils.request_error_handler import RequestErrorHandler

logger = logging.getLogger(__name__)


class OnlineIdentityVerificationClient(BaseIdvDataStoreService):
    def __init__(self, http_client: AsyncClient, user_access_token: str, settings=None):
        super().__init__(http_client, user_access_token)
        self._settings = settings or get_configuration()

    async def create_case(
        self,
        payload: dict | None = None,
    ) -> CreateIdentityVerificationResponse:
        request_payload = payload or {}
        response = await self._post(
            self._settings.idv_data_store_online_verification_endpoint,
            scope=self._settings.idv_data_store_config.IDV_DATA_STORE_ONLINE_VERIFICATION_SCOPES,
            context="idv-data-store online verification create request",
            payload=request_payload,
            include_idempotency_key=True,
        )

        if response.status_code == status.HTTP_409_CONFLICT:
            try:
                body = response.json()
            except ValueError:
                body = {}

            detail = body.get("detail") if isinstance(body.get("detail"), dict) else {}
            if detail.get("error") == "open_case_exists":
                existing_case_id = detail.get("existing_case_id")
                if existing_case_id:
                    logger.info(
                        "Open case exists for user, reissuing session for case_id: %s",
                        existing_case_id,
                    )
                    reissued_response = await self.reissue_session(existing_case_id)
                    return CreateIdentityVerificationResponse(
                        **reissued_response.model_dump()
                    )

        try:
            response.raise_for_status()
        except Exception as exc:
            RequestErrorHandler.handle(
                exc,
                context="idv-data-store online verification create request",
            )

        response_data = self.resolve_online_verification_url(response.json())
        return CreateIdentityVerificationResponse(**response_data)

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
        response_data: dict,
    ) -> dict:
        idv_verification_url = response_data.get("online_verification_url")
        if idv_verification_url:
            idv_settings = self._settings.idv_data_store_config
            response_data["online_verification_url"] = urljoin(
                f"{idv_settings.IDV_DATA_STORE_BASE_URL.rstrip('/')}/",
                idv_verification_url.lstrip("/"),
            )
        return response_data


async def create_online_identity_verification(
    global_http_client: AsyncClient,
    user_access_token: str,
    required_by_rp_client_id: Optional[str] = None,
) -> CreateIdentityVerificationResponse:
    settings = get_configuration()
    operation = OnlineIdentityVerificationClient(
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
    operation = OnlineIdentityVerificationClient(
        global_http_client,
        user_access_token,
        settings=settings,
    )
    return await operation.reissue_session(case_id)
