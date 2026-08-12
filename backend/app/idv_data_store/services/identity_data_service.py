import logging
import secrets
from typing import Any, Optional, TypeVar
from urllib.parse import urljoin

from fastapi import Depends, Request, status
from httpx import AsyncClient
from pydantic import BaseModel

from app.config import get_configuration
from app.identity_verification.schemas import (
    CreateIdentityVerificationResponse,
    CreateOnlineIdentityVerificationRequest,
    ReissueOnlineSessionResponse,
)
from app.idv_data_store.services.schemas import (
    ClaimsResponse,
    InPersonVerificationResponse,
    LastEmailSentResponse,
)
from app.idv_data_store.services.token_exchange import (
    exchange_token_for_idv_data_store,
)
from app.auth.services.auth_user_session import get_users_current_session

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
        return await self._service._request_model(
            settings.idv_data_store_in_person_verification_send_endpoint,
            scope=settings.idv_data_store_config.IDV_DATA_STORE_IN_PERSON_VERIFICATION_SCOPES,
            context="idv-data-store in-person verification send request",
            response_model=InPersonVerificationResponse,
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


class IdentityDataService:
    def __init__(self, http_client: AsyncClient, user_access_token: str):
        self._http_client = http_client
        self._user_access_token = user_access_token

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

    async def _post(
        self,
        endpoint: str,
        *,
        scope: str,
        context: str,
        payload: Optional[dict[str, Any]] = None,
        include_idempotency_key: bool = False,
    ):
        idv_scoped_access_token = await exchange_token_for_idv_data_store(
            self._http_client,
            self._user_access_token,
            scope=scope,
        )

        headers = {
            "Authorization": f"Bearer {idv_scoped_access_token}",
            "Accept": "application/json",
        }
        if include_idempotency_key:
            headers["Idempotency-Key"] = str(secrets.randbelow(10**16))

        request_kwargs = {"headers": headers}
        if payload is not None:
            request_kwargs["json"] = payload

        try:
            return await self._http_client.post(endpoint, **request_kwargs)
        except Exception as exc:
            RequestErrorHandler.handle(exc, context=context)

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
