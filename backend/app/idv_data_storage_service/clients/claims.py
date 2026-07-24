from app.idv_data_storage_service.schemas import (
    QueryRequestPayload,
    VerifiedClaimsQueryResponse,
)


class ClaimsClientMixin:
    async def query_verified_claims_json(
        self,
        payload: QueryRequestPayload,
        request_context=None,
    ) -> VerifiedClaimsQueryResponse:
        context = self._resolve_context(request_context)
        response = await self._request(
            method="POST",
            path=self.endpoints.claims_query,
            request_context=context,
            context="query verified claims (json)",
            json_payload=payload.model_dump(exclude_none=True),
        )
        return VerifiedClaimsQueryResponse.model_validate(response.json())
