"""
Unit tests for the online identity verification glue service and router.
"""

import importlib
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient
from app.identity_verification.schemas import CreateOnlineIdentityVerificationRequest
from app.identity_verification.services.online_identity_verification import (
    OnlineIdentityVerificationClient,
)

services_module = importlib.import_module(
    "app.identity_verification.services.online_identity_verification"
)
create_online_identity_verification = (
    services_module.create_online_identity_verification
)
reissue_online_session = services_module.reissue_online_session
get_verified_claims = services_module.get_verified_claims


@pytest.fixture
def mock_http_client():
    return AsyncMock(spec=AsyncClient)


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
