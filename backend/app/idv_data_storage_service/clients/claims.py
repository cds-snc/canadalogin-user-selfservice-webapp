from app.idv_data_storage_service.schemas import (
    QueryRequestPayload,
    VerificationStatusForEnrichmentResponse,
    VerifiedClaimsQueryResponse,
)


class ClaimsClientMixin:
    async def get_user_verification_status_json(
        self,
        user_id: str,
        request_context=None,
    ) -> VerificationStatusForEnrichmentResponse:
        context = self._resolve_context(request_context)
        response = await self._request(
            method="GET",
            path=self._path(
                self.endpoints.user_verification_status_by_id,
                user_id=user_id,
            ),
            request_context=context,
            context="get user verification status (json)",
        )
        return VerificationStatusForEnrichmentResponse.model_validate(response.json())

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
