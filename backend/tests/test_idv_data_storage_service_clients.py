import json
import importlib
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient, HTTPStatusError, Request, Response

from app.idv_data_storage_service.clients.claims import ClaimsClientMixin
from app.idv_data_storage_service.clients.client import IDVDataServiceClient
from app.idv_data_storage_service.clients.metadata import MetadataClientMixin
from app.idv_data_storage_service.clients.subjects import SubjectsClientMixin
from app.idv_data_storage_service.clients.validations import ValidationsClientMixin
from app.idv_data_storage_service.clients.endpoints import IDVDataServiceEndpoints
from app.idv_data_storage_service.config import IDVDataServiceConfig
from app.idv_data_storage_service.schemas import (
    CreateValidationRequest,
    RegisterSubjectRequest,
    RevokeValidationRequest,
    RequestContext,
    VerifiedClaimEntry,
    VerifiedClaimNationality,
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
async def test_request_accept_header_override(
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
        request_context=RequestContext(correlation_id="corr-override"),
        context="test accept",
        accept="application/problem+json",
    )

    headers = mock_http_client.request.call_args.kwargs["headers"]
    assert headers["Accept"] == "application/problem+json"


def test_build_absolute_url_requires_base_url(mock_http_client: AsyncMock) -> None:
    client = IDVDataServiceClient(
        mock_http_client,
        IDVDataServiceConfig(IDV_DATA_SERVICE_BASE_URL=None),
    )

    with patch(
        "app.idv_data_storage_service.clients.base.RequestErrorHandler.handle"
    ) as mock_handle:
        mock_handle.side_effect = RuntimeError("missing base url")

        with pytest.raises(RuntimeError, match="missing base url"):
            client._build_absolute_url("/v1/subjects")

        assert mock_handle.call_count == 1


def test_with_context_binds_default_correlation_id(
    client: IDVDataServiceClient,
) -> None:
    bound_client = client.with_context(RequestContext(correlation_id="bound-corr"))

    resolved = bound_client._resolve_context(None)
    assert resolved.correlation_id == "bound-corr"


def test_path_template_formatting(client: IDVDataServiceClient) -> None:
    path = client._path(client.endpoints.subject_by_id, subject_id="abc")
    assert path == "/v1/subjects/abc"


def test_path_without_template_params_returns_input(
    client: IDVDataServiceClient,
) -> None:
    assert client._path("/v1/subjects") == "/v1/subjects"


def test_endpoints_from_config_maps_expected_values(
    idv_config: IDVDataServiceConfig,
) -> None:
    endpoints = IDVDataServiceEndpoints.from_config(idv_config)

    assert endpoints.discovery == idv_config.IDV_DATA_SERVICE_DISCOVERY_PATH
    assert endpoints.jwks == idv_config.IDV_DATA_SERVICE_JWKS_PATH
    assert endpoints.subjects == idv_config.IDV_DATA_SERVICE_SUBJECTS_PATH


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
async def test_get_openid_configuration_returns_typed_model(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    mock_http_client.request.return_value = _build_httpx_response(
        "GET",
        "https://idv.example.com/.well-known/openid-configuration",
        payload={
            "issuer": "https://idv.example.com",
            "jwks_uri": "https://idv.example.com/.well-known/jwks.json",
            "claims_parameter_supported": True,
        },
    )

    result = await client.get_openid_configuration()

    assert result.issuer == "https://idv.example.com"
    assert result.claims_parameter_supported is True


@pytest.mark.asyncio
async def test_metadata_mixin_direct_invocation(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    mock_http_client.request.return_value = _build_httpx_response(
        "GET",
        "https://idv.example.com/.well-known/openid-configuration",
        payload={
            "issuer": "https://idv.example.com",
            "jwks_uri": "https://idv.example.com/.well-known/jwks.json",
        },
    )

    result = await MetadataClientMixin.get_openid_configuration(client)
    assert result.issuer == "https://idv.example.com"


@pytest.mark.asyncio
async def test_get_jwks_returns_keys(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    mock_http_client.request.return_value = _build_httpx_response(
        "GET",
        "https://idv.example.com/.well-known/jwks.json",
        payload={"keys": [{"kty": "RSA", "kid": "k1"}]},
    )

    jwks = await client.get_jwks()

    assert len(jwks.keys) == 1
    assert jwks.keys[0]["kid"] == "k1"


@pytest.mark.asyncio
async def test_register_subject_json_payload_and_response(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    mock_http_client.request.return_value = _build_httpx_response(
        "POST",
        "https://idv.example.com/v1/subjects",
        payload={
            "id": "subject-2",
            "external_sub": "user-456",
            "iss": "https://issuer.example.com",
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z",
        },
    )

    payload = RegisterSubjectRequest(
        external_sub="user-456",
        iss="https://issuer.example.com",
    )
    result = await client.register_subject_json(payload)

    sent_json = mock_http_client.request.call_args.kwargs["json"]
    assert sent_json == {
        "external_sub": "user-456",
        "iss": "https://issuer.example.com",
    }
    assert result.id == "subject-2"


@pytest.mark.asyncio
async def test_subjects_mixin_direct_invocation(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    mock_http_client.request.return_value = _build_httpx_response(
        "GET",
        "https://idv.example.com/v1/subjects/subject-direct",
        payload={
            "id": "subject-direct",
            "external_sub": "user-direct",
            "iss": "https://issuer.example.com",
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z",
        },
    )

    result = await SubjectsClientMixin.get_subject(client, "subject-direct")
    assert result.id == "subject-direct"


@pytest.mark.asyncio
async def test_erase_subject_json_handles_empty_response_body(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    mock_http_client.request.return_value = _build_httpx_response(
        "DELETE",
        "https://idv.example.com/v1/subjects/sub-erase",
        payload=None,
    )

    result = await client.erase_subject_json("sub-erase")

    assert result.job_id is None
    assert result.status is None


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
async def test_get_validation_json_builds_subject_and_validation_path(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    mock_http_client.request.return_value = _build_httpx_response(
        "GET",
        "https://idv.example.com/v1/subjects/sub-1/validations/val-1",
        payload={"validation_id": "val-1", "status": "active"},
    )

    result = await client.get_validation_json("sub-1", "val-1")

    assert result.validation_id == "val-1"
    call = mock_http_client.request.call_args.kwargs
    assert call["url"].endswith("/v1/subjects/sub-1/validations/val-1")


@pytest.mark.asyncio
async def test_revoke_validation_json_with_payload(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    mock_http_client.request.return_value = _build_httpx_response(
        "DELETE",
        "https://idv.example.com/v1/subjects/sub-1/validations/val-1",
        payload={"validation_id": "val-1", "status": "revoked"},
    )

    result = await client.revoke_validation_json(
        "sub-1",
        "val-1",
        RevokeValidationRequest(reason="subject_request", notes="requested deletion"),
    )

    sent_json = mock_http_client.request.call_args.kwargs["json"]
    assert sent_json["reason"] == "subject_request"
    assert result.status == "revoked"


@pytest.mark.asyncio
async def test_revoke_validation_json_handles_empty_response_body(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    mock_http_client.request.return_value = _build_httpx_response(
        "DELETE",
        "https://idv.example.com/v1/subjects/sub-1/validations/val-2",
        payload=None,
    )

    result = await client.revoke_validation_json("sub-1", "val-2")

    assert result.validation_id is None
    assert result.status is None


@pytest.mark.asyncio
async def test_validations_mixin_direct_invocation(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    mock_http_client.request.return_value = _build_httpx_response(
        "GET",
        "https://idv.example.com/v1/subjects/sub-direct/validations/val-direct",
        payload={"validation_id": "val-direct", "status": "active"},
    )

    result = await ValidationsClientMixin.get_validation_json(
        client,
        "sub-direct",
        "val-direct",
    )
    assert result.validation_id == "val-direct"


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
async def test_query_verified_claims_supports_nested_nationalities(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    mock_http_client.request.return_value = _build_httpx_response(
        "POST",
        "https://idv.example.com/v1/claims/query",
        payload={
            "verified_claims": {
                "nationalities": [
                    {"nationality_code": "CAN", "sort_order": 0},
                ]
            }
        },
    )

    payload = VerifiedClaimsQueryRequest(
        sub="user-789",
        sub_iss="https://issuer.example.com",
        requested_claims=VerifiedClaimEntry(
            nationalities=[
                VerifiedClaimNationality(nationality_code="CAN", sort_order=0)
            ]
        ),
    )

    response = await client.query_verified_claims_json(payload)

    assert response.verified_claims is not None
    assert response.verified_claims.nationalities[0].nationality_code == "CAN"


@pytest.mark.asyncio
async def test_claims_mixin_direct_invocation(
    client: IDVDataServiceClient,
    mock_http_client: AsyncMock,
) -> None:
    mock_http_client.request.return_value = _build_httpx_response(
        "POST",
        "https://idv.example.com/v1/claims/query",
        payload={"verified_claims": {"given_name": "Direct"}},
    )

    payload = VerifiedClaimsQueryRequest(
        sub="user-direct",
        sub_iss="https://issuer.example.com",
        requested_claims=VerifiedClaimEntry(given_name="Direct"),
    )
    result = await ClaimsClientMixin.query_verified_claims_json(client, payload)

    assert result.verified_claims is not None
    assert result.verified_claims.given_name == "Direct"


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


def test_import_surface_modules_and_exports() -> None:
    package_module = importlib.import_module("app.idv_data_storage_service")
    clients_module = importlib.import_module("app.idv_data_storage_service.clients")

    assert hasattr(package_module, "IDVDataServiceClient")
    assert hasattr(package_module, "IDVDataServiceConfig")
    assert hasattr(clients_module, "OutboundIDVClient")
