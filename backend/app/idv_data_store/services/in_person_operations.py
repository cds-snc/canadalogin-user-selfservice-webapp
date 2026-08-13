from app.config import get_configuration
from app.idv_data_store.services.base_idv_data_store_service import (
    BaseIdvDataStoreService,
)
from app.idv_data_store.services.schemas import (
    InPersonVerificationResponse,
    LastEmailSentResponse,
)
from app.utils.request_error_handler import RequestErrorHandler


class InPersonOperations(BaseIdvDataStoreService):
    def __init__(self, http_client, user_access_token: str, settings=None):
        super().__init__(http_client, user_access_token)
        self._settings = settings or get_configuration()

    async def send_code(
        self,
        payload: dict | None = None,
    ) -> InPersonVerificationResponse:
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
        # Backward compatibility: support both legacy and new upstream response shapes.
        if isinstance(body, dict) and "success" in body and "message" in body:
            return InPersonVerificationResponse(**body)

        return InPersonVerificationResponse(
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

    async def get_last_email_sent(self) -> LastEmailSentResponse:
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

        return LastEmailSentResponse(**response.json())
