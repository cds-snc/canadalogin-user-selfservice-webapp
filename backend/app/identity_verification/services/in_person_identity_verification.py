from httpx import AsyncClient

from app.config import get_configuration
from app.idv_data_store.services.base_idv_data_store_service import (
    BaseIdvDataStoreService,
)
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel


class InPersonIdentityVerificationService(BaseIdvDataStoreService):
    async def create_case(self, payload: dict | None = None) -> ResponseModel:
        settings = get_configuration()
        scope = (
            settings.idv_data_store_config.IDV_DATA_STORE_IDENTITY_VERIFICATION_SCOPES
        )

        request_body = dict(payload) if payload else {}
        request_body.setdefault("verification_provider", "service_canada")
        request_body.setdefault("applicant", {})

        response = await self._post(
            settings.idv_data_store_identity_verification_in_person_endpoint,
            scope=scope,
            context="idv-data-store in-person identity verification create request",
            payload=request_body,
            include_idempotency_key=True,
        )

        try:
            response.raise_for_status()
        except Exception as exc:
            RequestErrorHandler.handle(
                exc,
                context="idv-data-store in-person identity verification create request",
            )

        response_data = response.json()
        return ResponseModel(
            success=True,
            message="In-person identity verification case created",
            data={
                "case_id": response_data.get("case_id"),
                "status": response_data.get("status"),
                "verification_code": response_data.get("verification_code_display"),
                "verification_expires_at": response_data.get("expires_at"),
            },
        )

    async def get_last_email_sent(self) -> ResponseModel:
        settings = get_configuration()
        scope = (
            settings.idv_data_store_config.IDV_DATA_STORE_IN_PERSON_VERIFICATION_SCOPES
        )

        response = await self._post(
            settings.idv_data_store_in_person_verification_last_email_endpoint,
            scope=scope,
            context="idv-data-store in-person verification last-email-sent request",
        )

        try:
            response.raise_for_status()
        except Exception as exc:
            RequestErrorHandler.handle(
                exc,
                context="idv-data-store in-person verification last-email-sent request",
            )

        return ResponseModel(**response.json())


async def create_in_person_identity_verification_case(
    global_http_client: AsyncClient,
    user_access_token: str,
    payload: dict | None = None,
) -> ResponseModel:
    service = InPersonIdentityVerificationService(global_http_client, user_access_token)
    return await service.create_case(payload)


async def get_last_email_sent(
    global_http_client: AsyncClient,
    user_access_token: str,
) -> ResponseModel:
    service = InPersonIdentityVerificationService(global_http_client, user_access_token)
    return await service.get_last_email_sent()
