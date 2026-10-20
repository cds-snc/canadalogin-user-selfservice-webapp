"""Unit tests for the identity documents service and router endpoint."""

import importlib
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from authlib.integrations.starlette_client import OAuthError
from fastapi import HTTPException
from httpx import AsyncClient, Request, Response

from app.identity_verification.schemas import IdentityDocumentType
from app.utils.schemas import ResponseModel

identity_documents_module = importlib.import_module(
    "app.identity_verification.services.identity_documents"
)
get_identity_documents = identity_documents_module.get_identity_documents

base_module = importlib.import_module(
    "app.identity_verification.services.base_idv_data_store_service"
)

ENDPOINT = "https://idv-data-store.example.com/v1/identity-documents"

MOCK_CONFIGURATION = MagicMock()
MOCK_CONFIGURATION.idv_data_store_identity_documents_endpoint = ENDPOINT
MOCK_CONFIGURATION.idv_data_store_config.IDV_DATA_STORE_IDENTITY_DOCUMENTS_SCOPES = (
    "idv:identity-documents:read"
)

PR_CARD_DOCUMENT = {
    "key": "PERMANENT_RESIDENT_CARD",
    "name_en": "Permanent Resident Card",
    "name_fr": "Carte de résident permanent",
    "options": [
        {
            "id": 14,
            "name_en": "Canada",
            "name_fr": "Canada",
            "option_type": "value",
            "canada_post_id": "C019",
            "country_code": "CA",
            "province_code": None,
            "requires_proof": True,
        }
    ],
}


@pytest.fixture
def mock_http_client():
    return AsyncMock(spec=AsyncClient)


@pytest.fixture
def patched_dependencies():
    with (
        patch.object(
            identity_documents_module,
            "get_configuration",
            return_value=MOCK_CONFIGURATION,
        ),
        patch.object(base_module, "exchange_token_for_idv_data_store") as exchange,
    ):
        exchange.return_value = "idv-scoped-access-token"
        yield exchange


def _response(status_code: int, payload, url: str = ENDPOINT) -> Response:
    return Response(status_code=status_code, json=payload, request=Request("GET", url))


class TestGetIdentityDocuments:
    @pytest.mark.asyncio
    async def test_returns_documents_from_idv_data_store(
        self, mock_http_client, patched_dependencies
    ):
        mock_http_client.get = AsyncMock(
            return_value=_response(200, [PR_CARD_DOCUMENT])
        )

        result = await get_identity_documents(mock_http_client, "user-access-token")

        assert result.success is True
        assert result.message == "Identity documents retrieved"
        assert result.data == [PR_CARD_DOCUMENT]

        patched_dependencies.assert_awaited_once_with(
            mock_http_client,
            "user-access-token",
            scope="idv:identity-documents:read",
        )
        call_args = mock_http_client.get.call_args
        assert call_args.args[0] == ENDPOINT
        assert call_args.kwargs["headers"]["Authorization"] == (
            "Bearer idv-scoped-access-token"
        )
        assert "Idempotency-Key" not in call_args.kwargs["headers"]

    @pytest.mark.asyncio
    async def test_forwards_type_filters_as_repeated_query_params(
        self, mock_http_client, patched_dependencies
    ):
        mock_http_client.get = AsyncMock(return_value=_response(200, []))

        result = await get_identity_documents(
            mock_http_client,
            "user-access-token",
            [IdentityDocumentType.PASSPORT, IdentityDocumentType.DRIVERS_LICENCE],
        )

        assert result.data == []
        assert mock_http_client.get.call_args.args[0] == (
            f"{ENDPOINT}?types=PASSPORT&types=DRIVERS_LICENCE"
        )

    @pytest.mark.asyncio
    async def test_rejects_malformed_upstream_payload(
        self, mock_http_client, patched_dependencies
    ):
        mock_http_client.get = AsyncMock(
            return_value=_response(200, [{"key": "UNKNOWN"}])
        )

        with pytest.raises(HTTPException) as exc_info:
            await get_identity_documents(mock_http_client, "user-access-token")

        assert exc_info.value.status_code == 422

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "status_code,payload,expected_status",
        [
            (403, {"detail": "Forbidden"}, 403),
            (503, {"detail": "Identity document catalog is unavailable"}, 503),
        ],
    )
    async def test_maps_upstream_errors(
        self,
        status_code,
        payload,
        expected_status,
        mock_http_client,
        patched_dependencies,
    ):
        mock_http_client.get = AsyncMock(return_value=_response(status_code, payload))

        with pytest.raises(HTTPException) as exc_info:
            await get_identity_documents(mock_http_client, "user-access-token")

        assert exc_info.value.status_code == expected_status

    @pytest.mark.asyncio
    async def test_maps_401_to_oauth_error(
        self, mock_http_client, patched_dependencies
    ):
        mock_http_client.get = AsyncMock(
            return_value=_response(401, {"detail": "Unauthorized"})
        )

        with pytest.raises(OAuthError):
            await get_identity_documents(mock_http_client, "user-access-token")


class TestIdentityDocumentsRouterEndpoint:
    @pytest.mark.asyncio
    async def test_delegates_to_service(self):
        from app.identity_verification import v1_router

        mock_request = MagicMock()
        mock_request.app.state.request_client = AsyncMock()
        expected = ResponseModel(
            success=True,
            message="Identity documents retrieved",
            data=[PR_CARD_DOCUMENT],
        )

        with patch.object(
            v1_router, "get_identity_documents", AsyncMock(return_value=expected)
        ) as mock_service:
            result = await v1_router.list_identity_documents(
                request=mock_request,
                types=[IdentityDocumentType.PASSPORT],
                user_access_token="user-access-token",
            )

        assert result == expected
        mock_service.assert_awaited_once_with(
            mock_request.app.state.request_client,
            "user-access-token",
            [IdentityDocumentType.PASSPORT],
        )
