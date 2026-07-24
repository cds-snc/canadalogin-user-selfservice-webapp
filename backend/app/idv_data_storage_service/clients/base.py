from __future__ import annotations

from typing import Any

from httpx import AsyncClient, HTTPError, Response

from app.idv_data_storage_service.clients.endpoints import IDVDataServiceEndpoints
from app.idv_data_storage_service.config import IDVDataServiceConfig
from app.idv_data_storage_service.schemas import RequestContext
from app.utils.request_error_handler import RequestErrorHandler

APPLICATION_JSON = "application/json"
PROVIDER_NAME = "idv_data_service"


class OutboundIDVClient:
    """Reusable HTTP layer for outbound IDV/provider integration calls."""

    def __init__(
        self,
        global_http_client: AsyncClient,
        config: IDVDataServiceConfig,
        request_context: RequestContext | None = None,
    ):
        self._http_client = global_http_client
        self._config = config
        self._request_context = request_context
        self.endpoints = IDVDataServiceEndpoints.from_config(config)

    def _default_context(self) -> RequestContext:
        return self._request_context or RequestContext()

    def with_context(self, request_context: RequestContext) -> "OutboundIDVClient":
        """Return a client instance bound to a request context.

        This avoids passing the same context object repeatedly.
        """
        return self.__class__(
            global_http_client=self._http_client,
            config=self._config,
            request_context=request_context,
        )

    def _resolve_context(
        self, request_context: RequestContext | None
    ) -> RequestContext:
        return request_context or self._default_context()

    def _build_headers(
        self,
        request_context: RequestContext,
        *,
        content_type: str,
        accept: str | None = None,
    ) -> dict[str, str]:
        headers: dict[str, str] = {
            "Content-Type": content_type,
            "Accept": accept or content_type,
        }

        if accept:
            headers["Accept"] = accept
        if request_context.correlation_id:
            headers["X-Correlation-ID"] = request_context.correlation_id
        if self._config.IDV_DATA_SERVICE_API_KEY:
            headers["X-API-Key"] = self._config.IDV_DATA_SERVICE_API_KEY

        return headers

    def _build_absolute_url(self, path: str) -> str:
        base_url = (self._config.IDV_DATA_SERVICE_BASE_URL or "").strip()
        if not base_url:
            raise RequestErrorHandler.handle(
                ValueError("IDV data service base URL is not configured"),
                context="IDV data service URL construction",
            )
        return f"{base_url.rstrip('/')}/{path.lstrip('/')}"

    @staticmethod
    def _format_path(path_template: str, **params: str) -> str:
        return path_template.format(**params)

    def _path(self, path_or_template: str, **params: str) -> str:
        if params:
            return self._format_path(path_or_template, **params)
        return path_or_template

    async def _request(
        self,
        *,
        method: str,
        path: str,
        request_context: RequestContext,
        context: str,
        accept: str | None = None,
        json_payload: dict[str, Any] | None = None,
        query_params: dict[str, Any] | None = None,
    ) -> Response:
        try:
            response = await self._http_client.request(
                method=method,
                url=self._build_absolute_url(path),
                headers=self._build_headers(
                    request_context,
                    content_type=APPLICATION_JSON,
                    accept=accept,
                ),
                params=query_params,
                json=json_payload,
                timeout=self._config.IDV_DATA_SERVICE_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            return response
        except HTTPError as exc:
            RequestErrorHandler.handle(
                exc,
                context=f"{PROVIDER_NAME} {context}",
            )
