from unittest.mock import AsyncMock, patch

import pytest
from fastapi import status
from httpx import HTTPStatusError, Request as HttpxRequest, Response as HttpxResponse
from starlette.requests import Request

from app.utils.global_error_handlers import http_status_error_handler


def make_starlette_request() -> Request:
    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/test",
            "headers": [],
        }
    )


def make_http_status_error(status_code: int, body: dict) -> HTTPStatusError:
    request = HttpxRequest("GET", "https://verify.example.com/test")
    response = HttpxResponse(status_code=status_code, json=body, request=request)
    return HTTPStatusError("Upstream error", request=request, response=response)


@pytest.mark.asyncio
async def test_http_status_error_handler_preserves_429_status():
    request = make_starlette_request()
    exc = make_http_status_error(
        status.HTTP_429_TOO_MANY_REQUESTS,
        {"messageId": "RateLimitExceeded"},
    )

    with patch(
        "app.utils.global_error_handlers.standard_logger.log", new=AsyncMock()
    ) as mock_log:
        mock_log.side_effect = lambda _request, response: response
        response = await http_status_error_handler(request, exc)

    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    payload = response.body.decode("utf-8")
    assert "RateLimitExceeded" in payload


@pytest.mark.asyncio
async def test_http_status_error_handler_passthrough_non_429_status():
    request = make_starlette_request()
    exc = make_http_status_error(
        status.HTTP_400_BAD_REQUEST,
        {"messageId": "CSIAK9999E"},
    )

    with patch(
        "app.utils.global_error_handlers.standard_logger.log", new=AsyncMock()
    ) as mock_log:
        mock_log.side_effect = lambda _request, response: response
        response = await http_status_error_handler(request, exc)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    payload = response.body.decode("utf-8")
    assert "CSIAK9999E" in payload
