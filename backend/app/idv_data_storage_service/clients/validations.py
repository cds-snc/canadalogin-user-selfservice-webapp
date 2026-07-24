from app.idv_data_storage_service.schemas import (
    CreateValidationRequest,
    RevokeValidationRequest,
    ValidationDetailResponse,
    ValidationListResponse,
)


class ValidationsClientMixin:
    async def submit_validation_json(
        self,
        subject_id: str,
        payload: CreateValidationRequest,
        request_context=None,
    ) -> ValidationDetailResponse:
        context = self._resolve_context(request_context)
        response = await self._request(
            method="POST",
            path=self._path(
                self.endpoints.validations_by_subject, subject_id=subject_id
            ),
            request_context=context,
            context="submit validation (json)",
            json_payload=payload.model_dump(exclude_none=True),
        )
        return ValidationDetailResponse.model_validate(response.json())

    async def list_validations_json(
        self,
        subject_id: str,
        *,
        status: str | None = None,
        trust_framework: str | None = None,
        cursor: str | None = None,
        limit: int | None = None,
        request_context=None,
    ) -> ValidationListResponse:
        params = {
            "status": status,
            "trust_framework": trust_framework,
            "cursor": cursor,
            "limit": limit,
        }
        query_params = {
            key: value for key, value in params.items() if value is not None
        }
        context = self._resolve_context(request_context)
        response = await self._request(
            method="GET",
            path=self._path(
                self.endpoints.validations_by_subject, subject_id=subject_id
            ),
            request_context=context,
            context="list validations",
            query_params=query_params,
        )
        return ValidationListResponse.model_validate(response.json())

    async def get_validation_json(
        self,
        subject_id: str,
        validation_id: str,
        request_context=None,
    ) -> ValidationDetailResponse:
        collection_path = self._path(
            self.endpoints.validations_by_subject,
            subject_id=subject_id,
        ).rstrip("/")
        context = self._resolve_context(request_context)
        response = await self._request(
            method="GET",
            path=f"{collection_path}/{validation_id}",
            request_context=context,
            context="get validation",
        )
        return ValidationDetailResponse.model_validate(response.json())

    async def revoke_validation_json(
        self,
        subject_id: str,
        validation_id: str,
        payload: RevokeValidationRequest | None = None,
        request_context=None,
    ) -> ValidationDetailResponse:
        collection_path = self._path(
            self.endpoints.validations_by_subject,
            subject_id=subject_id,
        ).rstrip("/")
        context = self._resolve_context(request_context)
        response = await self._request(
            method="DELETE",
            path=f"{collection_path}/{validation_id}",
            request_context=context,
            context="revoke validation (json)",
            json_payload=payload.model_dump(exclude_none=True) if payload else None,
        )
        response_payload = response.json() if response.content else {}
        return ValidationDetailResponse.model_validate(response_payload)
