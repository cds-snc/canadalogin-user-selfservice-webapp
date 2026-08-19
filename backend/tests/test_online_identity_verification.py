"""
Unit tests for the online identity verification glue service and router.
"""

import importlib
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException
from httpx import AsyncClient, HTTPStatusError, Request, Response
from app.identity_verification.schemas import CreateOnlineIdentityVerificationRequest
from app.identity_verification.services.online_identity_verification import (
    OnlineIdentityVerificationClient,
)

services_module = importlib.import_module(
    "app.identity_verification.services.online_identity_verification"
)
base_module = importlib.import_module(
    "app.identity_verification.services.base_idv_data_store_service"
)
create_online_identity_verification = (
    services_module.create_online_identity_verification
)
reissue_online_session = services_module.reissue_online_session
get_verified_claims = services_module.get_verified_claims

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


class TestCreateOnlineIdentityVerification:
    @pytest.mark.asyncio
    @patch.object(services_module, "OnlineIdentityVerificationClient")
    async def test_success_creates_case_and_returns_response(
        self,
        mock_operation_class,
        mock_http_client,
    ):
        mock_operation = MagicMock(spec=OnlineIdentityVerificationClient)
        mock_operation.create_case = AsyncMock(
            return_value=services_module.CreateIdentityVerificationResponse(
                case_id="case-123",
                status="pending",
                online_verification_url="https://idv-data-store.example.com/start/case-123",
            )
        )
        mock_operation_class.return_value = mock_operation

        result = await create_online_identity_verification(
            mock_http_client,
            "user-access-token",
            required_by_rp_client_id="rp-client-id",
        )

        assert result.case_id == "case-123"
        assert result.status.value == "pending"
        mock_operation.create_case.assert_awaited_once_with(
            {"required_by_rp_client_id": "rp-client-id"}
        )

    @pytest.mark.asyncio
    @patch.object(services_module, "OnlineIdentityVerificationClient")
    async def test_success_without_required_by_rp_client_id(
        self,
        mock_operation_class,
        mock_http_client,
    ):
        mock_operation = MagicMock(spec=OnlineIdentityVerificationClient)
        mock_operation.create_case = AsyncMock(
            return_value=services_module.CreateIdentityVerificationResponse(
                case_id="case-456",
                status="pending",
                online_verification_url="https://idv-data-store.example.com/start/case-456",
            )
        )
        mock_operation_class.return_value = mock_operation

        result = await create_online_identity_verification(
            mock_http_client,
            "user-access-token",
        )

        assert result.case_id == "case-456"
        mock_operation.create_case.assert_awaited_once_with({})

    @pytest.mark.asyncio
    @patch.object(services_module, "OnlineIdentityVerificationClient")
    async def test_conflict_logic_is_delegated_to_online_operations(
        self,
        mock_operation_class,
        mock_http_client,
    ):
        mock_operation = MagicMock(spec=OnlineIdentityVerificationClient)
        mock_operation.create_case = AsyncMock(
            return_value=services_module.CreateIdentityVerificationResponse(
                case_id="64bd14f2-c620-4671-9d94-1cb0192ee552",
                status="in_progress",
                online_verification_url="https://idv-data-store.example.com/start/64bd14f2-c620-4671-9d94-1cb0192ee552",
            )
        )
        mock_operation_class.return_value = mock_operation

        result = await create_online_identity_verification(
            mock_http_client, "user-access-token"
        )

        assert result.case_id == "64bd14f2-c620-4671-9d94-1cb0192ee552"


class TestReissueOnlineSession:
    @pytest.mark.asyncio
    @patch.object(services_module, "OnlineIdentityVerificationClient")
    async def test_success_reissues_session_and_returns_response(
        self,
        mock_operation_class,
        mock_http_client,
    ):
        mock_operation = MagicMock(spec=OnlineIdentityVerificationClient)
        mock_operation.reissue_session = AsyncMock(
            return_value=services_module.ReissueOnlineSessionResponse(
                case_id="case-123",
                status="in_progress",
                online_verification_url="https://idv-data-store.example.com/start/case-123?reissued=1",
            )
        )
        mock_operation_class.return_value = mock_operation

        result = await reissue_online_session(
            mock_http_client, "user-access-token", "case-123"
        )

        assert result.case_id == "case-123"
        assert result.status.value == "in_progress"
        mock_operation.reissue_session.assert_awaited_once_with("case-123")


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
        client = OnlineIdentityVerificationClient(
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
        client = OnlineIdentityVerificationClient(
            mock_http_client,
            "user-access-token",
            settings=MOCK_CONFIGURATION,
        )

        with pytest.raises(HTTPException) as exc_info:
            await client.get_verified_claims()

        assert exc_info.value.status_code == 502
        assert exc_info.value.detail == "idv-data-store verified claims request failed"

    @pytest.mark.asyncio
    @patch.object(services_module, "OnlineIdentityVerificationClient")
    async def test_success_gets_verified_claims(
        self,
        mock_operation_class,
        mock_http_client,
    ):
        mock_operation = MagicMock(spec=OnlineIdentityVerificationClient)
        expected_claims = {"given_name": "Ada", "family_name": "Lovelace"}
        mock_operation.get_verified_claims = AsyncMock(return_value=expected_claims)
        mock_operation_class.return_value = mock_operation

        result = await get_verified_claims(mock_http_client, "user-access-token")

        assert result == expected_claims
        mock_operation_class.assert_called_once_with(
            mock_http_client,
            "user-access-token",
            settings=services_module.get_configuration(),
        )
        mock_operation.get_verified_claims.assert_awaited_once_with()


class TestOnlineIdentityVerificationRouterEndpoints:
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

    @pytest.mark.asyncio
    async def test_create_online_identity_verification_case_endpoint(self):
        from app.identity_verification.v1_router import (
            create_online_identity_verification_case,
        )

        mock_request = MagicMock()
        mock_request.app.state.request_client = AsyncMock()

        expected_response = services_module.CreateIdentityVerificationResponse(
            case_id="case-123",
            status="pending",
            online_verification_url="https://idv-data-store.example.com/start/case-123",
        )

        with patch.object(
            importlib.import_module("app.identity_verification.v1_router"),
            "create_online_identity_verification",
            AsyncMock(return_value=expected_response),
        ):
            result = await create_online_identity_verification_case(
                mock_request,
                CreateOnlineIdentityVerificationRequest(required_by_rp_client_id=None),
                "user-access-token",
            )

        assert result.success is True
        assert result.message == "Online identity verification case created"
        assert result.data["case_id"] == "case-123"

    @pytest.mark.asyncio
    async def test_create_online_identity_verification_case_endpoint_without_body(
        self,
    ):
        from app.identity_verification.v1_router import (
            create_online_identity_verification_case,
        )

        mock_request = MagicMock()
        mock_request.app.state.request_client = AsyncMock()

        expected_response = services_module.CreateIdentityVerificationResponse(
            case_id="case-123",
            status="pending",
            online_verification_url="https://idv-data-store.example.com/start/case-123",
        )

        with patch.object(
            importlib.import_module("app.identity_verification.v1_router"),
            "create_online_identity_verification",
            AsyncMock(return_value=expected_response),
        ) as mock_create_online:
            result = await create_online_identity_verification_case(
                mock_request,
                None,
                "user-access-token",
            )

        assert result.success is True
        assert result.message == "Online identity verification case created"
        assert result.data["case_id"] == "case-123"
        mock_create_online.assert_awaited_once_with(
            mock_request.app.state.request_client,
            "user-access-token",
            required_by_rp_client_id=None,
        )
