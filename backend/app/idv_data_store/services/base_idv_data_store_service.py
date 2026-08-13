import logging
from typing import Any, Optional
from uuid import uuid4

from httpx import AsyncClient, Response

from app.idv_data_store.services.token_exchange import (
    exchange_token_for_idv_data_store,
)
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.tls import should_disable_tls_verify_for_localhost

logger = logging.getLogger(__name__)


class BaseIdvDataStoreService:
    def __init__(self, http_client: AsyncClient, user_access_token: str):
        self._http_client = http_client
        self._user_access_token = user_access_token

    async def _get(
        self,
        endpoint: str,
        *,
        scope: str,
        context: str,
        include_idempotency_key: bool = False,
    ) -> Response:
        return await self._request(
            "get",
            endpoint,
            scope=scope,
            context=context,
            include_idempotency_key=include_idempotency_key,
        )

    async def _post(
        self,
        endpoint: str,
        *,
        scope: str,
        context: str,
        payload: Optional[dict[str, Any]] = None,
        include_idempotency_key: bool = False,
    ) -> Response:
        return await self._request(
            "post",
            endpoint,
            scope=scope,
            context=context,
            payload=payload,
            include_idempotency_key=include_idempotency_key,
        )

    async def _request(
        self,
        method: str,
        endpoint: str,
        *,
        scope: str,
        context: str,
        payload: Optional[dict[str, Any]] = None,
        include_idempotency_key: bool = False,
    ) -> Response:
        idv_scoped_access_token = await exchange_token_for_idv_data_store(
            self._http_client,
            self._user_access_token,
            scope=scope,
        )

        headers = {
            "Authorization": f"Bearer {idv_scoped_access_token}",
            "Accept": "application/json",
        }
        if include_idempotency_key:
            headers["Idempotency-Key"] = str(uuid4())

        request_kwargs: dict[str, Any] = {"headers": headers}
        if payload is not None:
            request_kwargs["json"] = payload

        try:
            return await self._dispatch_request(method, endpoint, request_kwargs)
        except Exception as exc:
            RequestErrorHandler.handle(exc, context=context)
            raise

    async def _dispatch_request(
        self,
        method: str,
        endpoint: str,
        request_kwargs: dict[str, Any],
    ) -> Response:
        if should_disable_tls_verify_for_localhost(endpoint):
            async with AsyncClient(
                verify=False,
                timeout=self._http_client.timeout,
            ) as local_client:
                return await self._perform_request(
                    local_client,
                    method,
                    endpoint,
                    request_kwargs,
                )

        return await self._perform_request(
            self._http_client,
            method,
            endpoint,
            request_kwargs,
        )

    async def _perform_request(
        self,
        client: AsyncClient,
        method: str,
        endpoint: str,
        request_kwargs: dict[str, Any],
    ) -> Response:
        if method == "get":
            return await client.get(endpoint, **request_kwargs)
        if method == "post":
            return await client.post(endpoint, **request_kwargs)
        return await client.request(method.upper(), endpoint, **request_kwargs)
