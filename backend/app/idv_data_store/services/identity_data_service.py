import logging
from typing import Any, Optional

from fastapi import Depends, Request, status

from app.auth.services.auth_user_session import get_users_current_session
from app.config import get_configuration
from app.identity_verification.schemas import (
    CreateIdentityVerificationResponse,
    CreateOnlineIdentityVerificationRequest,
)
from app.idv_data_store.services.base_idv_data_store_service import (
    BaseIdvDataStoreService,
)
from app.idv_data_store.services.claims_operations import ClaimsOperations
from app.idv_data_store.services.in_person_operations import InPersonOperations
from app.idv_data_store.services.online_operations import OnlineOperations
from app.utils.request_error_handler import RequestErrorHandler

logger = logging.getLogger(__name__)


class IdentityDataService(BaseIdvDataStoreService):
    def __init__(self, http_client, user_access_token: str):
        super().__init__(http_client, user_access_token)
        self._settings = get_configuration()

    async def create_identity_verification_case(
        self,
        payload: Optional[CreateOnlineIdentityVerificationRequest] = None,
    ) -> CreateIdentityVerificationResponse:
        request_payload: dict[str, Any] = {}
        if payload is not None and payload.required_by_rp_client_id is not None:
            request_payload["required_by_rp_client_id"] = (
                payload.required_by_rp_client_id
            )

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
                    reissued_response = await self.online().reissue_session(
                        existing_case_id
                    )
                    return CreateIdentityVerificationResponse(
                        **reissued_response.model_dump()
                    )

        try:
            response.raise_for_status()
        except Exception as exc:
            RequestErrorHandler.handle(
                exc, context="idv-data-store online verification create request"
            )

        response_data = self.online().resolve_online_verification_url(response.json())
        return CreateIdentityVerificationResponse(**response_data)

    def claims(self) -> ClaimsOperations:
        return ClaimsOperations(
            self._http_client,
            self._user_access_token,
            settings=self._settings,
        )

    def in_person(self) -> InPersonOperations:
        return InPersonOperations(
            self._http_client,
            self._user_access_token,
            settings=self._settings,
        )

    def online(self) -> OnlineOperations:
        return OnlineOperations(
            self._http_client,
            self._user_access_token,
            settings=self._settings,
        )


def get_identity_data_service(
    request: Request,
    user_access_token: str = Depends(get_users_current_session),
) -> IdentityDataService:
    return IdentityDataService(
        http_client=request.app.state.request_client,
        user_access_token=user_access_token,
    )
