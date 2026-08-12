"""
Unit tests for the online identity verification glue service and router.
"""

import importlib
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient
from app.identity_verification.schemas import CreateOnlineIdentityVerificationRequest
from app.idv_data_store.client.storage_service.identity_data_service import (
    IdentityDataService,
)

services_module = importlib.import_module(
    "app.identity_verification.services.online_identity_verification"
)
create_online_identity_verification = (
    services_module.create_online_identity_verification
)
reissue_online_session = services_module.reissue_online_session

@pytest.fixture
def mock_http_client():
    return AsyncMock(spec=AsyncClient)


class TestCreateOnlineIdentityVerification:
    @pytest.mark.asyncio
    @patch.object(services_module, "IdentityDataService")
    async def test_success_creates_case_and_returns_response(
        self,
        mock_service_class,
        mock_http_client,
    ):
        mock_service = MagicMock(spec=IdentityDataService)
        mock_service.create_identity_verification_case = AsyncMock(
            return_value=services_module.CreateIdentityVerificationResponse(
                case_id="case-123",
                status="pending",
                online_verification_url="https://idv-data-store.example.com/start/case-123",
            )
        )
        mock_service_class.return_value = mock_service

        result = await create_online_identity_verification(
            mock_http_client,
            "user-access-token",
            required_by_rp_client_id="rp-client-id",
        )

        assert result.case_id == "case-123"
        assert result.status.value == "pending"
        mock_service.create_identity_verification_case.assert_awaited_once()
        payload = mock_service.create_identity_verification_case.await_args.args[0]
        assert payload.required_by_rp_client_id == "rp-client-id"

    @pytest.mark.asyncio
    @patch.object(services_module, "IdentityDataService")
    async def test_success_without_required_by_rp_client_id(
        self,
        mock_service_class,
        mock_http_client,
    ):
        mock_service = MagicMock(spec=IdentityDataService)
        mock_service.create_identity_verification_case = AsyncMock(
            return_value=services_module.CreateIdentityVerificationResponse(
                case_id="case-456",
                status="pending",
                online_verification_url="https://idv-data-store.example.com/start/case-456",
            )
        )
        mock_service_class.return_value = mock_service

        result = await create_online_identity_verification(
            mock_http_client,
            "user-access-token",
        )

        assert result.case_id == "case-456"
        payload = mock_service.create_identity_verification_case.await_args.args[0]
        assert payload.required_by_rp_client_id is None

    @pytest.mark.asyncio
    @patch.object(services_module, "IdentityDataService")
    async def test_conflict_logic_is_delegated_to_central_service(
        self,
        mock_service_class,
        mock_http_client,
    ):
        mock_service = MagicMock(spec=IdentityDataService)
        mock_service.create_identity_verification_case = AsyncMock(
            return_value=services_module.CreateIdentityVerificationResponse(
                case_id="64bd14f2-c620-4671-9d94-1cb0192ee552",
                status="in_progress",
                online_verification_url="https://idv-data-store.example.com/start/64bd14f2-c620-4671-9d94-1cb0192ee552",
            )
        )
        mock_service_class.return_value = mock_service

        result = await create_online_identity_verification(mock_http_client, "user-access-token")

        assert result.case_id == "64bd14f2-c620-4671-9d94-1cb0192ee552"


class TestReissueOnlineSession:
    @pytest.mark.asyncio
    @patch.object(services_module, "IdentityDataService")
    async def test_success_reissues_session_and_returns_response(
        self,
        mock_service_class,
        mock_http_client,
    ):
        mock_service = MagicMock(spec=IdentityDataService)
        mock_service.online.return_value.reissue_session = AsyncMock(
            return_value=services_module.ReissueOnlineSessionResponse(
                case_id="case-123",
                status="in_progress",
                online_verification_url="https://idv-data-store.example.com/start/case-123?reissued=1",
            )
        )
        mock_service_class.return_value = mock_service

        result = await reissue_online_session(
            mock_http_client, "user-access-token", "case-123"
        )

        assert result.case_id == "case-123"
        assert result.status.value == "in_progress"
        mock_service.online.return_value.reissue_session.assert_awaited_once_with(
            "case-123"
        )


class TestOnlineIdentityVerificationRouterEndpoints:
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
