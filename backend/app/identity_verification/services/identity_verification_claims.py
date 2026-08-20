from httpx import AsyncClient

from app.config import get_configuration
from app.identity_verification.services.base_idv_data_store_service import (
    BaseIdvDataStoreService,
)
from app.utils.request_error_handler import RequestErrorHandler


class IdentityVerificationClaimsClient(BaseIdvDataStoreService):
    def __init__(self, http_client: AsyncClient, user_access_token: str, settings=None):
        super().__init__(http_client, user_access_token)
        self._settings = settings or get_configuration()

    async def get_verified_claims(self) -> dict:
        response = await self._get(
            self._settings.idv_data_store_verified_claims_endpoint,
            scope=self._settings.idv_data_store_config.IDV_DATA_STORE_IDENTITY_VERIFICATION_SCOPES,
            context="idv-data-store verified claims request",
        )

        try:
            response.raise_for_status()
        except Exception as exc:
            RequestErrorHandler.handle(
                exc,
                context="idv-data-store verified claims request",
            )

        return response.json()


async def get_verified_claims(
    global_http_client: AsyncClient,
    user_access_token: str,
) -> dict:
    settings = get_configuration()
    operation = IdentityVerificationClaimsClient(
        global_http_client,
        user_access_token,
        settings=settings,
    )
    return await operation.get_verified_claims()
