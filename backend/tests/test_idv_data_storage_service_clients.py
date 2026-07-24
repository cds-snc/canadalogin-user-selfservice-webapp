import json
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient, HTTPStatusError, Request, Response

from app.idv_data_storage_service.clients.client import IDVDataServiceClient
from app.idv_data_storage_service.config import IDVDataServiceConfig
from app.idv_data_storage_service.schemas import (
    CreateValidationRequest,
    RequestContext,
    VerifiedClaimEntry,
    VerifiedClaimsQueryRequest,
)


def _build_httpx_response(
    method: str,
    url: str,
    payload: dict | None,
    status_code: int = 200,
) -> Response:
    request = Request(method, url)
    content = b"" if payload is None else json.dumps(payload).encode("utf-8")
    return Response(status_code=status_code, request=request, content=content)


@pytest.fixture
def mock_http_client() -> AsyncMock:
    return AsyncMock(spec=AsyncClient)


@pytest.fixture
def idv_config() -> IDVDataServiceConfig:
    return IDVDataServiceConfig(
        IDV_DATA_SERVICE_BASE_URL="https://idv.example.com",
        IDV_DATA_SERVICE_API_KEY="test-key",
        IDV_DATA_SERVICE_TIMEOUT_SECONDS=11,
    )


@pytest.fixture
def client(
    mock_http_client: AsyncMock, idv_config: IDVDataServiceConfig
) -> IDVDataServiceClient:
    return IDVDataServiceClient(mock_http_client, idv_config)


@pytest.mark.asyncio
async def test_request_builds_expected_url_headers_and_timeout(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    mock_http_client.request.return_value = _build_httpx_response(
        "GET",
        "https://idv.example.com/v1/subjects",
        payload={"ok": True},
    )

    await client._request(
        method="GET",
        path="/v1/subjects",
        request_context=RequestContext(correlation_id="corr-1"),
        context="test request",
    )

    call = mock_http_client.request.call_args.kwargs
    assert call["method"] == "GET"
    assert call["url"] == "https://idv.example.com/v1/subjects"
    assert call["timeout"] == 11
    assert call["headers"]["Content-Type"] == "application/json"
    assert call["headers"]["Accept"] == "application/json"
    assert call["headers"]["X-API-Key"] == "test-key"
    assert call["headers"]["X-Correlation-ID"] == "corr-1"


@pytest.mark.asyncio
async def test_get_subject_returns_typed_model(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    mock_http_client.request.return_value = _build_httpx_response(
        "GET",
        "https://idv.example.com/v1/subjects/subject-1",
        payload={
            "id": "subject-1",
            "external_sub": "user-123",
            "iss": "https://issuer.example.com",
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z",
        },
    )

    subject = await client.get_subject("subject-1")

    assert subject.id == "subject-1"
    assert subject.external_sub == "user-123"


@pytest.mark.asyncio
async def test_list_validations_filters_none_query_params(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    mock_http_client.request.return_value = _build_httpx_response(
        "GET",
        "https://idv.example.com/v1/subjects/sub-1/validations",
        payload={"validations": [], "next_cursor": None, "total_count": 0},
    )

    await client.list_validations_json(
        "sub-1",
        status="active",
        trust_framework=None,
        cursor=None,
        limit=25,
    )

    params = mock_http_client.request.call_args.kwargs["params"]
    assert params == {"status": "active", "limit": 25}


@pytest.mark.asyncio
async def test_query_verified_claims_json_sends_typed_payload(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    mock_http_client.request.return_value = _build_httpx_response(
        "POST",
        "https://idv.example.com/v1/claims/query",
        payload={"verified_claims": {"given_name": "Jane"}},
    )

    payload = VerifiedClaimsQueryRequest(
        sub="user-123",
        sub_iss="https://issuer.example.com",
        requested_claims=VerifiedClaimEntry(given_name="Jane"),
    )

    response = await client.query_verified_claims_json(payload)

    sent_json = mock_http_client.request.call_args.kwargs["json"]
    assert sent_json["sub"] == "user-123"
    assert sent_json["requested_claims"]["given_name"] == "Jane"
    assert response.verified_claims is not None
    assert response.verified_claims.given_name == "Jane"


@pytest.mark.asyncio
async def test_submit_validation_json_sends_verified_claims_object(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    mock_http_client.request.return_value = _build_httpx_response(
        "POST",
        "https://idv.example.com/v1/subjects/sub-1/validations",
        payload={"validation_id": "val-1", "status": "active"},
    )

    payload = CreateValidationRequest(
        verified_claims=VerifiedClaimEntry(
            given_name="Jane",
            family_name="Doe",
            birthdate="1990-06-15",
        ),
        verification={"trust_framework": "nist_800_63A"},
    )

    result = await client.submit_validation_json("sub-1", payload)

    sent_json = mock_http_client.request.call_args.kwargs["json"]
    assert sent_json["verified_claims"]["given_name"] == "Jane"
    assert sent_json["verification"]["trust_framework"] == "nist_800_63A"
    assert result.validation_id == "val-1"


@pytest.mark.asyncio
async def test_request_routes_http_errors_through_request_error_handler(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    failing_request = Request("GET", "https://idv.example.com/v1/subjects")
    failing_response = Response(502, request=failing_request)
    http_error = HTTPStatusError(
        "upstream failure", request=failing_request, response=failing_response
    )
    mock_http_client.request.side_effect = http_error

    with patch(
        "app.idv_data_storage_service.clients.base.RequestErrorHandler.handle"
    ) as mock_handle:
        mock_handle.side_effect = RuntimeError("handled")

        with pytest.raises(RuntimeError, match="handled"):
            await client._request(
                method="GET",
                path="/v1/subjects",
                request_context=RequestContext(correlation_id="corr-2"),
                context="get subject",
            )

        mock_handle.assert_called_once_with(
            http_error,
            context="idv_data_service get subject",
        )
