"""
Unit tests for app.idv_data_store.services.token_exchange.
"""

import importlib
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient, HTTPStatusError, Request, Response

module = importlib.import_module("app.idv_data_store.services.token_exchange")
exchange_token_for_idv_data_store = module.exchange_token_for_idv_data_store

MOCK_CONFIGURATION = MagicMock()
MOCK_CONFIGURATION.token_api_endpoint = "https://verify.example.com/oauth2/token"
MOCK_CONFIGURATION.idv_data_store_config.IDV_DATA_STORE_STS_CLIENT_ID = "sts-client-id"
MOCK_CONFIGURATION.idv_data_store_config.IDV_DATA_STORE_STS_CLIENT_SECRET = (
    "sts-client-secret"
)


@pytest.fixture
def mock_http_client():
    return AsyncMock(spec=AsyncClient)


class TestExchangeTokenForIdvDataStore:
    @pytest.mark.asyncio
    @patch.object(module, "get_configuration", return_value=MOCK_CONFIGURATION)
    async def test_success_returns_exchanged_access_token(
        self, mock_get_configuration, mock_http_client
    ):
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"access_token": "exchanged-access-token"}
        mock_http_client.post = AsyncMock(return_value=mock_response)

        result = await exchange_token_for_idv_data_store(
            mock_http_client,
            "user-access-token",
            scope="idv:in-person-verification:send",
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
        assert payload["scope"] == "idv:in-person-verification:send"

    @pytest.mark.asyncio
    @patch.object(module, "get_configuration", return_value=MOCK_CONFIGURATION)
    async def test_missing_access_token_raises(self, mock_get_configuration, mock_http_client):
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {}
        mock_http_client.post = AsyncMock(return_value=mock_response)

        with pytest.raises(Exception):
            await exchange_token_for_idv_data_store(
                mock_http_client,
                "user-access-token",
                scope="idv:in-person-verification:send",
            )

    @pytest.mark.asyncio
    @patch.object(module, "get_configuration", return_value=MOCK_CONFIGURATION)
    @patch.object(module, "RequestErrorHandler")
    async def test_upstream_error_handled(
        self,
        mock_error_handler,
        mock_get_configuration,
        mock_http_client,
    ):
        request = Request("POST", "https://verify.example.com/oauth2/token")
        error_response = Response(400, request=request, json={"error": "invalid_grant"})

        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock(
            side_effect=HTTPStatusError("error", request=request, response=error_response)
        )
        mock_http_client.post = AsyncMock(return_value=mock_response)

        await exchange_token_for_idv_data_store(
            mock_http_client,
            "user-access-token",
            scope="idv:in-person-verification:send",
        )

        mock_error_handler.handle.assert_called_once()
