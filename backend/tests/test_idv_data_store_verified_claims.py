"""
Unit tests for the idv-data-store token exchange + verified claims services.
"""

import importlib
import pytest
from httpx import AsyncClient, HTTPStatusError, Request, Response
from unittest.mock import AsyncMock, MagicMock, patch

verified_claims_module = importlib.import_module(
    "app.idv_data_store.services.verified_claims"
)
exchange_token_for_idv_data_store = (
    verified_claims_module.exchange_token_for_idv_data_store
)
get_idv_data_store_client_token = verified_claims_module.get_idv_data_store_client_token
dispatch_get_verified_claims_from_idv_data_store = (
    verified_claims_module.dispatch_get_verified_claims_from_idv_data_store
)
get_verified_identity_claims = verified_claims_module.get_verified_identity_claims

MOCK_CONFIGURATION = MagicMock()
MOCK_CONFIGURATION.token_api_endpoint = "https://verify.example.com/oauth2/token"
MOCK_CONFIGURATION.idv_data_store_token_endpoint = (
    "https://idv-data-store.example.com/v1/admin/token"
)
MOCK_CONFIGURATION.idv_data_store_exchange_endpoint = (
    "https://idv-data-store.example.com/v1/auth/verified-claims"
)
MOCK_CONFIGURATION.idv_data_store_config.IDV_DATA_STORE_STS_CLIENT_ID = "sts-client-id"
MOCK_CONFIGURATION.idv_data_store_config.IDV_DATA_STORE_STS_CLIENT_SECRET = (
    "sts-client-secret"
)
MOCK_CONFIGURATION.idv_data_store_config.IDV_DATA_STORE_SCOPES = (
    "idv:auth:verified-claims"
)
MOCK_CONFIGURATION.idv_data_store_config.IDV_DATA_STORE_CLIENT_ID = "webapp-client-id"


@pytest.fixture
def mock_http_client():
    return AsyncMock(spec=AsyncClient)


class TestExchangeTokenForIdvDataStore:
    """Tests for exchange_token_for_idv_data_store"""

    @pytest.mark.asyncio
    @patch.object(
        verified_claims_module, "get_configuration", return_value=MOCK_CONFIGURATION
    )
    async def test_success_returns_exchanged_access_token(
        self, mock_get_configuration, mock_http_client
    ):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"access_token": "exchanged-access-token"}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        result = await exchange_token_for_idv_data_store(
            mock_http_client, "user-access-token"
        )

        assert result == "exchanged-access-token"

        call_args = mock_http_client.post.call_args
        url = call_args[0][0] if call_args[0] else call_args.kwargs.get("url")
        assert url == "https://verify.example.com/oauth2/token"

        payload = call_args.kwargs.get("data")
        assert payload["grant_type"] == (
            "urn:ietf:params:oauth:grant-type:token-exchange"
        )
        assert payload["client_id"] == "sts-client-id"
        assert payload["client_secret"] == "sts-client-secret"
        assert payload["subject_token"] == "user-access-token"
        assert payload["scope"] == "idv:auth:verified-claims"

    @pytest.mark.asyncio
    @patch.object(
        verified_claims_module, "get_configuration", return_value=MOCK_CONFIGURATION
    )
    async def test_missing_access_token_raises(
        self, mock_get_configuration, mock_http_client
    ):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        with pytest.raises(Exception):
            await exchange_token_for_idv_data_store(
                mock_http_client, "user-access-token"
            )

    @pytest.mark.asyncio
    @patch.object(
        verified_claims_module, "get_configuration", return_value=MOCK_CONFIGURATION
    )
    @patch.object(verified_claims_module, "RequestErrorHandler")
    async def test_upstream_error_handled(
        self, mock_error_handler, mock_get_configuration, mock_http_client
    ):
        request = Request("POST", "https://verify.example.com/oauth2/token")
        error_response = Response(400, request=request, json={"error": "invalid_grant"})

        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.raise_for_status = MagicMock(
            side_effect=HTTPStatusError(
                "error", request=request, response=error_response
            )
        )
        mock_http_client.post = AsyncMock(return_value=mock_response)

        await exchange_token_for_idv_data_store(mock_http_client, "user-access-token")

        mock_error_handler.handle.assert_called_once()


class TestGetIdvDataStoreClientToken:
    """Tests for get_idv_data_store_client_token"""

    @pytest.mark.asyncio
    @patch.object(
        verified_claims_module, "get_configuration", return_value=MOCK_CONFIGURATION
    )
    async def test_success_returns_client_token(
        self, mock_get_configuration, mock_http_client
    ):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"access_token": "idv-data-store-jwt"}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        result = await get_idv_data_store_client_token(mock_http_client)

        assert result == "idv-data-store-jwt"

        call_args = mock_http_client.post.call_args
        url = call_args[0][0] if call_args[0] else call_args.kwargs.get("url")
        assert url == "https://idv-data-store.example.com/v1/admin/token"

        params = call_args.kwargs.get("params")
        assert params["client_id"] == "webapp-client-id"
        assert params["scopes"] == "idv:auth:verified-claims"

    @pytest.mark.asyncio
    @patch.object(
        verified_claims_module, "get_configuration", return_value=MOCK_CONFIGURATION
    )
    async def test_missing_access_token_raises(
        self, mock_get_configuration, mock_http_client
    ):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {}
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        with pytest.raises(Exception):
            await get_idv_data_store_client_token(mock_http_client)


class TestDispatchGetVerifiedClaimsFromIdvDataStore:
    """Tests for dispatch_get_verified_claims_from_idv_data_store"""

    @pytest.mark.asyncio
    @patch.object(
        verified_claims_module, "get_configuration", return_value=MOCK_CONFIGURATION
    )
    @patch.object(verified_claims_module, "get_idv_data_store_client_token")
    async def test_success_returns_claims(
        self, mock_get_client_token, mock_get_configuration, mock_http_client
    ):
        mock_get_client_token.return_value = "idv-data-store-jwt"

        expected_claims = {
            "sub": "812000BUS2",
            "email": "john.phan+t2@cds-snc.ca",
        }
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = expected_claims
        mock_response.raise_for_status = MagicMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)

        result = await dispatch_get_verified_claims_from_idv_data_store(
            mock_http_client, "idv-scoped-access-token"
        )

        assert result == expected_claims

        call_args = mock_http_client.post.call_args
        url = call_args[0][0] if call_args[0] else call_args.kwargs.get("url")
        assert url == "https://idv-data-store.example.com/v1/auth/verified-claims"

        payload = call_args.kwargs.get("json")
        assert payload == {"access_token": "idv-scoped-access-token"}

        headers = call_args.kwargs.get("headers")
        assert headers["Authorization"] == "Bearer idv-data-store-jwt"


class TestGetVerifiedIdentityClaims:
    """Tests for the get_verified_identity_claims orchestrator"""

    @pytest.mark.asyncio
    @patch.object(verified_claims_module, "exchange_token_for_idv_data_store")
    @patch.object(
        verified_claims_module, "dispatch_get_verified_claims_from_idv_data_store"
    )
    async def test_orchestrates_exchange_then_claims_lookup(
        self, mock_dispatch_claims, mock_exchange, mock_http_client
    ):
        mock_exchange.return_value = "idv-scoped-access-token"
        expected_claims = {"sub": "812000BUS2", "email": "john.phan+t2@cds-snc.ca"}
        mock_dispatch_claims.return_value = expected_claims

        result = await get_verified_identity_claims(
            mock_http_client, "user-access-token"
        )

        mock_exchange.assert_awaited_once_with(mock_http_client, "user-access-token")
        mock_dispatch_claims.assert_awaited_once_with(
            mock_http_client, "idv-scoped-access-token"
        )

        assert result.success is True
        assert result.data == expected_claims


class TestGetVerifiedClaimsEndpoint:
    """Tests for GET /idv-data-store/verified-claims router endpoint."""

    @pytest.mark.asyncio
    async def test_returns_verified_claims(self):
        from app.idv_data_store.v1_router import get_verified_claims

        mock_request = MagicMock()
        mock_request.app.state.request_client = AsyncMock()

        expected_claims = {"sub": "812000BUS2", "email": "john.phan+t2@cds-snc.ca"}

        with patch.object(
            importlib.import_module("app.idv_data_store.v1_router"),
            "get_verified_identity_claims",
            AsyncMock(
                return_value=verified_claims_module.ResponseModel(
                    success=True,
                    message="Verified identity claims retrieved successfully",
                    data=expected_claims,
                )
            ),
        ):
            result = await get_verified_claims(mock_request, "user-access-token")

        assert result.success is True
        assert result.data == expected_claims
