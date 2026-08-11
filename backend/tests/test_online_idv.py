"""
Unit tests for the online identity verification glue service and router.
"""

import importlib
from unittest.mock import AsyncMock, MagicMock, call, patch

import pytest
from fastapi import HTTPException
from httpx import AsyncClient

online_idv_module = importlib.import_module("app.identity_verification.online_idv")
create_online_identity_verification = (
    online_idv_module.create_online_identity_verification
)
reissue_online_session = online_idv_module.reissue_online_session

MOCK_CONFIGURATION = MagicMock()
MOCK_CONFIGURATION.idv_data_store_online_verification_endpoint = (
    "https://idv-data-store.example.com/v1/identity-verifications/online"
)
MOCK_CONFIGURATION.idv_data_store_online_session_endpoint = MagicMock(
    side_effect=lambda case_id: (
        "https://idv-data-store.example.com/v1/identity-verifications/"
        f"{case_id}/online-session"
    )
)
MOCK_CONFIGURATION.idv_data_store_config.IDV_DATA_STORE_ONLINE_VERIFICATION_SCOPES = (
    "idv:online-verification:manage"
)
MOCK_CONFIGURATION.idv_data_store_config.IDV_DATA_STORE_IN_PERSON_VERIFICATION_SCOPES = (
    "idv:in-person-verification:send"
)


@pytest.fixture
def mock_http_client():
    return AsyncMock(spec=AsyncClient)


def _mock_response(json_data):
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = json_data
    response.raise_for_status = MagicMock()
    return response


class TestCreateOnlineIdentityVerification:
    @pytest.mark.asyncio
    @patch.object(
        online_idv_module, "get_configuration", return_value=MOCK_CONFIGURATION
    )
    @patch.object(online_idv_module, "exchange_token_for_idv_data_store")
    async def test_falls_back_to_in_person_scope_when_online_scope_rejected(
        self,
        mock_exchange,
        mock_get_configuration,
        mock_http_client,
    ):
        mock_exchange.side_effect = [
            HTTPException(status_code=400, detail="Bad request"),
            "fallback-idv-scoped-access-token",
        ]
        mock_http_client.post = AsyncMock(
            return_value=_mock_response(
                {
                    "case_id": "case-123",
                    "status": "pending",
                    "online_verification_url": "https://idv-data-store.example.com/start/case-123",
                }
            )
        )

        result = await create_online_identity_verification(
            mock_http_client,
            "user-access-token",
            required_by_rp_client_id="rp-client-id",
        )

        assert result.case_id == "case-123"

        mock_exchange.assert_has_awaits(
            [
                call(
                    mock_http_client,
                    "user-access-token",
                    scope="idv:online-verification:manage",
                ),
                call(
                    mock_http_client,
                    "user-access-token",
                    scope="idv:in-person-verification:send",
                ),
            ]
        )

        call_args = mock_http_client.post.call_args
        assert call_args.kwargs["headers"]["Authorization"] == (
            "Bearer fallback-idv-scoped-access-token"
        )

    @pytest.mark.asyncio
    @patch.object(
        online_idv_module, "get_configuration", return_value=MOCK_CONFIGURATION
    )
    @patch.object(online_idv_module, "exchange_token_for_idv_data_store")
    async def test_success_creates_case_and_returns_response(
        self,
        mock_exchange,
        mock_get_configuration,
        mock_http_client,
    ):
        mock_exchange.return_value = "idv-scoped-access-token"
        mock_http_client.post = AsyncMock(
            return_value=_mock_response(
                {
                    "case_id": "case-123",
                    "status": "pending",
                    "online_verification_url": "https://idv-data-store.example.com/start/case-123",
                }
            )
        )

        result = await create_online_identity_verification(
            mock_http_client,
            "user-access-token",
            required_by_rp_client_id="rp-client-id",
        )

        assert result.case_id == "case-123"
        assert result.status.value == "pending"
        assert result.online_verification_url == (
            "https://idv-data-store.example.com/start/case-123"
        )

        mock_exchange.assert_awaited_once_with(
            mock_http_client,
            "user-access-token",
            scope="idv:online-verification:manage",
        )

        call_args = mock_http_client.post.call_args
        url = call_args[0][0] if call_args[0] else call_args.kwargs.get("url")
        assert (
            url == "https://idv-data-store.example.com/v1/identity-verifications/online"
        )
        assert call_args.kwargs["json"] == {"required_by_rp_client_id": "rp-client-id"}
        assert call_args.kwargs["headers"]["Authorization"] == (
            "Bearer idv-scoped-access-token"
        )

    @pytest.mark.asyncio
    @patch.object(
        online_idv_module, "get_configuration", return_value=MOCK_CONFIGURATION
    )
    @patch.object(online_idv_module, "exchange_token_for_idv_data_store")
    @patch.object(online_idv_module, "reissue_online_session")
    async def test_conflict_reissues_existing_session(
        self,
        mock_reissue,
        mock_exchange,
        mock_get_configuration,
        mock_http_client,
    ):
        mock_exchange.return_value = "idv-scoped-access-token"
        mock_http_client.post = AsyncMock(
            return_value=_mock_response(
                {
                    "detail": {
                        "error": "open_case_exists",
                        "message": "An open case already exists for this user",
                        "existing_case_id": "64bd14f2-c620-4671-9d94-1cb0192ee552",
                    }
                }
            )
        )
        mock_http_client.post.return_value.status_code = 409
        mock_reissue.return_value = online_idv_module.ReissueOnlineSessionResponse(
            case_id="64bd14f2-c620-4671-9d94-1cb0192ee552",
            status="in_progress",
            online_verification_url="https://idv-data-store.example.com/start/64bd14f2-c620-4671-9d94-1cb0192ee552",
        )

        result = await create_online_identity_verification(
            mock_http_client,
            "user-access-token",
        )

        assert result.case_id == "64bd14f2-c620-4671-9d94-1cb0192ee552"
        assert result.online_verification_url.endswith(
            "64bd14f2-c620-4671-9d94-1cb0192ee552"
        )
        mock_reissue.assert_awaited_once_with(
            mock_http_client,
            "user-access-token",
            "64bd14f2-c620-4671-9d94-1cb0192ee552",
        )


class TestReissueOnlineSession:
    @pytest.mark.asyncio
    @patch.object(
        online_idv_module, "get_configuration", return_value=MOCK_CONFIGURATION
    )
    @patch.object(online_idv_module, "exchange_token_for_idv_data_store")
    async def test_success_reissues_session_and_returns_response(
        self,
        mock_exchange,
        mock_get_configuration,
        mock_http_client,
    ):
        mock_exchange.return_value = "idv-scoped-access-token"
        mock_http_client.post = AsyncMock(
            return_value=_mock_response(
                {
                    "case_id": "case-123",
                    "status": "in_progress",
                    "online_verification_url": "https://idv-data-store.example.com/start/case-123?reissued=1",
                }
            )
        )

        result = await reissue_online_session(
            mock_http_client, "user-access-token", "case-123"
        )

        assert result.case_id == "case-123"
        assert result.status.value == "in_progress"
        assert result.online_verification_url.endswith("reissued=1")

        call_args = mock_http_client.post.call_args
        url = call_args[0][0] if call_args[0] else call_args.kwargs.get("url")
        assert (
            url
            == "https://idv-data-store.example.com/v1/identity-verifications/case-123/online-session"
        )
        assert "json" not in call_args.kwargs


class TestOnlineIdentityVerificationRouterEndpoints:
    @pytest.mark.asyncio
    async def test_create_online_identity_verification_case_endpoint(self):
        from app.identity_verification.v1_router import (
            create_online_identity_verification_case,
        )

        mock_request = MagicMock()
        mock_request.app.state.request_client = AsyncMock()

        expected_response = online_idv_module.CreateIdentityVerificationResponse(
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
                online_idv_module.CreateOnlineIdentityVerificationRequest(
                    required_by_rp_client_id=None
                ),
                "user-access-token",
            )

        assert result.case_id == "case-123"

    @pytest.mark.asyncio
    async def test_create_online_identity_verification_case_endpoint_without_body(
        self,
    ):
        from app.identity_verification.v1_router import (
            create_online_identity_verification_case,
        )

        mock_request = MagicMock()
        mock_request.app.state.request_client = AsyncMock()

        expected_response = online_idv_module.CreateIdentityVerificationResponse(
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

        assert result.case_id == "case-123"
        mock_create_online.assert_awaited_once_with(
            mock_request.app.state.request_client,
            "user-access-token",
            required_by_rp_client_id=None,
        )
