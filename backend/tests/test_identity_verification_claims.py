"""
Unit tests for identity verification claims service and endpoint.
"""

import importlib
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException
from httpx import AsyncClient, HTTPStatusError, Request, Response

claims_module = importlib.import_module(
    "app.identity_verification.services.identity_verification_claims"
)
base_module = importlib.import_module(
    "app.identity_verification.services.base_idv_data_store_service"
)
get_verified_claims = claims_module.get_verified_claims
RealIdentityVerificationClaimsClient = claims_module.IdentityVerificationClaimsClient

MOCK_CONFIGURATION = MagicMock()
MOCK_CONFIGURATION.idv_data_store_verified_claims_endpoint = (
    "https://idv-data-store.example.com/v1/identity-verifications/claims"
)
MOCK_CONFIGURATION.idv_data_store_config.IDV_DATA_STORE_IDENTITY_VERIFICATION_SCOPES = (
    "idv:auth:verified-claims"
)


@pytest.fixture
def mock_http_client():
    return AsyncMock(spec=AsyncClient)


def _mock_response(json_data, status_code=200):
    response = MagicMock()
    response.status_code = status_code
    response.json.return_value = json_data
    response.raise_for_status = MagicMock()
    return response


class TestGetVerifiedClaims:
    @pytest.mark.asyncio
    @patch.object(base_module, "exchange_token_for_idv_data_store")
    async def test_client_get_verified_claims_fetches_claims_from_data_store(
        self,
        mock_exchange,
        mock_http_client,
    ):
        expected_claims = {
            "status": "verified",
            "case_id": "case-123",
            "verified_claims": {
                "claims": {"given_name": "Ada", "family_name": "Lovelace"}
            },
        }
        mock_exchange.return_value = "idv-scoped-access-token"
        mock_http_client.get = AsyncMock(return_value=_mock_response(expected_claims))
        client = claims_module.IdentityVerificationClaimsClient(
            mock_http_client,
            "user-access-token",
            settings=MOCK_CONFIGURATION,
        )

        result = await client.get_verified_claims()

        assert result == expected_claims
        mock_exchange.assert_awaited_once_with(
            mock_http_client,
            "user-access-token",
            scope="idv:auth:verified-claims",
        )
        mock_http_client.get.assert_awaited_once_with(
            "https://idv-data-store.example.com/v1/identity-verifications/claims",
            headers={
                "Authorization": "Bearer idv-scoped-access-token",
                "Accept": "application/json",
            },
        )

    @pytest.mark.asyncio
    @patch.object(base_module, "exchange_token_for_idv_data_store")
    async def test_client_get_verified_claims_handles_non_success_response(
        self,
        mock_exchange,
        mock_http_client,
    ):
        request = Request(
            "GET",
            "https://idv-data-store.example.com/v1/identity-verifications/claims",
        )
        response = Response(status_code=502, request=request)
        http_error = HTTPStatusError(
            "Bad Gateway",
            request=request,
            response=response,
        )
        mock_exchange.return_value = "idv-scoped-access-token"
        mock_response = _mock_response({"message": "Bad Gateway"}, status_code=502)
        mock_response.raise_for_status.side_effect = http_error
        mock_http_client.get = AsyncMock(return_value=mock_response)
        client = claims_module.IdentityVerificationClaimsClient(
            mock_http_client,
            "user-access-token",
            settings=MOCK_CONFIGURATION,
        )

        with pytest.raises(HTTPException) as exc_info:
            await client.get_verified_claims()

        assert exc_info.value.status_code == 502
        assert exc_info.value.detail == "idv-data-store verified claims request failed"

    @pytest.mark.asyncio
    @patch.object(claims_module, "IdentityVerificationClaimsClient")
    async def test_success_gets_verified_claims(
        self,
        mock_operation_class,
        mock_http_client,
    ):
        mock_operation = MagicMock(spec=RealIdentityVerificationClaimsClient)
        expected_claims = {"given_name": "Ada", "family_name": "Lovelace"}
        mock_operation.get_verified_claims = AsyncMock(return_value=expected_claims)
        mock_operation_class.return_value = mock_operation

        result = await get_verified_claims(mock_http_client, "user-access-token")

        assert result == expected_claims
        mock_operation_class.assert_called_once_with(
            mock_http_client,
            "user-access-token",
            settings=claims_module.get_configuration(),
        )
        mock_operation.get_verified_claims.assert_awaited_once_with()


class TestIdentityVerificationClaimsRouterEndpoint:
    @pytest.mark.asyncio
    async def test_get_identity_verification_claims_endpoint(self):
        from app.identity_verification.v1_router import get_identity_verification_claims

        mock_request = MagicMock()
        mock_request.app.state.request_client = AsyncMock()
        expected_claims = {"given_name": "Ada", "family_name": "Lovelace"}

        with patch.object(
            importlib.import_module("app.identity_verification.v1_router"),
            "get_verified_claims",
            AsyncMock(return_value=expected_claims),
        ) as mock_get_claims:
            result = await get_identity_verification_claims(
                mock_request,
                "user-access-token",
            )

        assert result.success is True
        assert result.message == "Verified claims retrieved"
        assert result.data == expected_claims
        mock_get_claims.assert_awaited_once_with(
            mock_request.app.state.request_client,
            "user-access-token",
        )
