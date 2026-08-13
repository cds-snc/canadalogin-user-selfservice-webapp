import logging
from typing import Any, Optional, TypeVar
from urllib.parse import urljoin

from fastapi import Depends, Request, status
from httpx import AsyncClient
from pydantic import BaseModel

from app.auth.services.auth_user_session import get_users_current_session
from app.config import get_configuration
from app.identity_verification.schemas import (
    CreateIdentityVerificationResponse,
    CreateOnlineIdentityVerificationRequest,
    ReissueOnlineSessionResponse,
)
from app.idv_data_store.services.base_idv_data_store_service import (
    BaseIdvDataStoreService,
)
from app.idv_data_store.services.schemas import (
    ClaimsResponse,
    InPersonVerificationResponse,
    LastEmailSentResponse,
)
from app.utils.request_error_handler import RequestErrorHandler

logger = logging.getLogger(__name__)
ModelT = TypeVar("ModelT", bound=BaseModel)


class ClaimsOperations:
    def __init__(self, service: "IdentityDataService"):
        self._service = service

    async def get(self) -> ClaimsResponse:
        settings = get_configuration()
        response = await self._service._post(
            settings.idv_data_store_userinfo_endpoint,
            scope=settings.idv_data_store_config.IDV_DATA_STORE_AUTH_USERINFO_SCOPES,
            context="idv-data-store userinfo request",
        )

        try:
            response.raise_for_status()
        except Exception as exc:
            RequestErrorHandler.handle(exc, context="idv-data-store userinfo request")

        return ClaimsResponse(claims=response.json())


class InPersonOperations:
    def __init__(self, service: "IdentityDataService"):
        self._service = service

    async def send_code(self) -> InPersonVerificationResponse:
        settings = get_configuration()
        response = await self._service._post(
            settings.idv_data_store_identity_verification_in_person_endpoint,
            scope=settings.idv_data_store_config.IDV_DATA_STORE_IDENTITY_VERIFICATION_SCOPES,
            context="idv-data-store in-person identity verification create request",
            include_idempotency_key=True,
            payload={
                "verification_provider": "service_canada",
                "applicant": {},
            },
        )

        try:
            response.raise_for_status()
        except Exception as exc:
            RequestErrorHandler.handle(
                exc,
                context="idv-data-store in-person identity verification create request",
            )

        body = response.json()
        # Backward compatibility: support both legacy and new upstream response shapes.
        if isinstance(body, dict) and "success" in body and "message" in body:
            return InPersonVerificationResponse(**body)

        return InPersonVerificationResponse(
            success=True,
            message="In-person identity verification case created",
            data={
                "verification_code": body.get("verification_code_display")
                if isinstance(body, dict)
                else None,
                "case_id": body.get("case_id") if isinstance(body, dict) else None,
                "status": body.get("status") if isinstance(body, dict) else None,
                "verification_expires_at": body.get("expires_at")
                if isinstance(body, dict)
                else None,
            },
        )

    async def get_last_email_sent(self) -> LastEmailSentResponse:
        settings = get_configuration()
        return await self._service._request_model(
            settings.idv_data_store_in_person_verification_last_email_endpoint,
            scope=settings.idv_data_store_config.IDV_DATA_STORE_IN_PERSON_VERIFICATION_SCOPES,
            context="idv-data-store in-person verification last-email-sent request",
            response_model=LastEmailSentResponse,
        )


class OnlineOperations:
    def __init__(self, service: "IdentityDataService"):
        self._service = service

    async def reissue_session(self, case_id: str) -> ReissueOnlineSessionResponse:
        settings = get_configuration()
        response = await self._service._post(
            settings.idv_data_store_online_session_endpoint(case_id),
            scope=settings.idv_data_store_config.IDV_DATA_STORE_ONLINE_VERIFICATION_SCOPES,
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

        response_data = self._service._resolve_online_verification_url(response.json())
        return ReissueOnlineSessionResponse(**response_data)


class IdentityDataService(BaseIdvDataStoreService):
    async def create_identity_verification_case(
        self,
        payload: Optional[CreateOnlineIdentityVerificationRequest] = None,
    ) -> CreateIdentityVerificationResponse:
        settings = get_configuration()
        request_payload: dict[str, Any] = {}
        if payload is not None and payload.required_by_rp_client_id is not None:
            request_payload["required_by_rp_client_id"] = (
                payload.required_by_rp_client_id
            )

        response = await self._post(
            settings.idv_data_store_online_verification_endpoint,
            scope=settings.idv_data_store_config.IDV_DATA_STORE_ONLINE_VERIFICATION_SCOPES,
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

        response_data = self._resolve_online_verification_url(response.json())
        return CreateIdentityVerificationResponse(**response_data)

    def claims(self) -> ClaimsOperations:
        return ClaimsOperations(self)

    def in_person(self) -> InPersonOperations:
        return InPersonOperations(self)

    def online(self) -> OnlineOperations:
        return OnlineOperations(self)

    async def _request_model(
        self,
        endpoint: str,
        *,
        scope: str,
        context: str,
        response_model: type[ModelT],
    ) -> ModelT:
        response = await self._post(
            endpoint,
            scope=scope,
            context=context,
        )

        try:
            response.raise_for_status()
        except Exception as exc:
            RequestErrorHandler.handle(exc, context=context)

        return response_model(**response.json())

    def _resolve_online_verification_url(
        self,
        response_data: dict[str, Any],
    ) -> dict[str, Any]:
        idv_verification_url = response_data.get("online_verification_url")
        if idv_verification_url:
            idv_settings = get_configuration().idv_data_store_config
            response_data["online_verification_url"] = urljoin(
                f"{idv_settings.IDV_DATA_STORE_BASE_URL.rstrip('/')}/",
                idv_verification_url.lstrip("/"),
            )
        return response_data


def get_identity_data_service(
    request: Request,
    user_access_token: str = Depends(get_users_current_session),
) -> IdentityDataService:
    return IdentityDataService(
        http_client=request.app.state.request_client,
        user_access_token=user_access_token,
    )
