from app.idv_data_storage_service.schemas import (
    RegisterSubjectRequest,
    SubjectErasureAcceptedResponse,
    SubjectResponse,
)


class SubjectsClientMixin:
    async def register_subject_json(self, payload: RegisterSubjectRequest, request_context=None) -> SubjectResponse:
        """JSON helper for local/dev flows before JWE/JWS is enforced."""
        context = self._resolve_context(request_context)
        response = await self._request(
            method="POST",
            path=self.endpoints.subjects,
            request_context=context,
            context="register subject (json)",
            json_payload=payload.model_dump(exclude_none=True),
        )
        return SubjectResponse.model_validate(response.json())

    async def get_subject(self, subject_id: str, request_context=None) -> SubjectResponse:
        context = self._resolve_context(request_context)
        response = await self._request(
            method="GET",
            path=self._path(self.endpoints.subject_by_id, subject_id=subject_id),
            request_context=context,
            context="get subject",
        )
        return SubjectResponse.model_validate(response.json())

    async def erase_subject_json(self, subject_id: str, request_context=None) -> SubjectErasureAcceptedResponse:
        """Starts asynchronous subject erasure workflow and returns job metadata."""
        context = self._resolve_context(request_context)
        response = await self._request(
            method="DELETE",
            path=self._path(self.endpoints.subject_by_id, subject_id=subject_id),
            request_context=context,
            context="erase subject (json)",
        )
        payload = response.json() if response.content else {}
        return SubjectErasureAcceptedResponse.model_validate(payload)
