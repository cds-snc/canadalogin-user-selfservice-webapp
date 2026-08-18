from httpx import AsyncClient

from app.config import get_configuration
from app.identity_verification.services.base_idv_data_store_service import (
    BaseIdvDataStoreService,
)
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel


class InPersonIdentityVerificationClient(BaseIdvDataStoreService):
    def __init__(self, http_client: AsyncClient, user_access_token: str, settings=None):
        super().__init__(http_client, user_access_token)
        self._settings = settings or get_configuration()

    async def send_code(self, payload: dict | None = None) -> ResponseModel:
        request_body = dict(payload) if payload else {}
        request_body.setdefault("verification_provider", "service_canada")
        request_body.setdefault("applicant", {})

        response = await self._post(
            self._settings.idv_data_store_identity_verification_in_person_endpoint,
            scope=self._settings.idv_data_store_config.IDV_DATA_STORE_IDENTITY_VERIFICATION_SCOPES,
            context="idv-data-store in-person identity verification create request",
            include_idempotency_key=True,
            payload=request_body,
        )

        try:
            response.raise_for_status()
        except Exception as exc:
            RequestErrorHandler.handle(
                exc,
                context="idv-data-store in-person identity verification create request",
            )

        body = response.json()
        if isinstance(body, dict) and "success" in body and "message" in body:
            return ResponseModel(**body)

        return ResponseModel(
            success=True,
            message="In-person identity verification case created",
            data={
                "verification_code": (
                    body.get("verification_code_display")
                    if isinstance(body, dict)
                    else None
                ),
                "case_id": body.get("case_id") if isinstance(body, dict) else None,
                "status": body.get("status") if isinstance(body, dict) else None,
                "verification_expires_at": (
                    body.get("expires_at") if isinstance(body, dict) else None
                ),
            },
        )

    async def get_last_email_sent(self) -> ResponseModel:
        response = await self._post(
            self._settings.idv_data_store_in_person_verification_last_email_endpoint,
            scope=self._settings.idv_data_store_config.IDV_DATA_STORE_IN_PERSON_VERIFICATION_SCOPES,
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
    settings = get_configuration()
    operation = InPersonIdentityVerificationClient(
        global_http_client,
        user_access_token,
        settings=settings,
    )
    return await operation.send_code(payload)


async def get_last_email_sent(
    global_http_client: AsyncClient,
    user_access_token: str,
) -> ResponseModel:
    settings = get_configuration()
    operation = InPersonIdentityVerificationClient(
        global_http_client,
        user_access_token,
        settings=settings,
    )
    return await operation.get_last_email_sent()
