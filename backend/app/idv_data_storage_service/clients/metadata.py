from app.idv_data_storage_service.schemas import (
    JwksResponse,
    OpenIDConfigurationResponse,
)


class MetadataClientMixin:
    async def get_openid_configuration(
        self, request_context=None
    ) -> OpenIDConfigurationResponse:
        context = self._resolve_context(request_context)
        response = await self._request(
            method="GET",
            path=self.endpoints.discovery,
            request_context=context,
            context="get openid configuration",
        )
        return OpenIDConfigurationResponse.model_validate(response.json())

    async def get_jwks(self, request_context=None) -> JwksResponse:
        context = self._resolve_context(request_context)
        response = await self._request(
            method="GET",
            path=self.endpoints.jwks,
            request_context=context,
            context="get jwks",
        )
        return JwksResponse.model_validate(response.json())
