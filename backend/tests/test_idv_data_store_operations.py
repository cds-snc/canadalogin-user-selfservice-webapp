from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

from app.identity_verification.schemas import ReissueOnlineSessionResponse
from app.idv_data_store.services.claims_operations import ClaimsOperations
from app.idv_data_store.services.online_operations import OnlineOperations


@pytest.fixture
def mock_http_client():
    return AsyncMock(spec=AsyncClient)


@pytest.fixture
def mock_settings():
    settings = MagicMock()
    settings.idv_data_store_userinfo_endpoint = (
        "https://idv-data-store.example.com/v1/auth/userinfo"
    )
    settings.idv_data_store_online_verification_endpoint = (
        "https://idv-data-store.example.com/v1/identity-verifications/online"
    )
    settings.idv_data_store_online_session_endpoint = MagicMock(
        side_effect=lambda case_id: (
            "https://idv-data-store.example.com/v1/identity-verifications/"
            f"{case_id}/online-session"
        )
    )
    settings.idv_data_store_config.IDV_DATA_STORE_AUTH_USERINFO_SCOPES = (
        "idv:auth:userinfo"
    )
    settings.idv_data_store_config.IDV_DATA_STORE_ONLINE_VERIFICATION_SCOPES = (
        "idv:validations:write"
    )
    settings.idv_data_store_config.IDV_DATA_STORE_BASE_URL = (
        "https://idv-data-store.example.com"
    )
    return settings


def _mock_response(json_data, status_code=200):
    response = MagicMock()
    response.status_code = status_code
    response.json.return_value = json_data
    response.raise_for_status = MagicMock()
    return response


class TestClaimsOperations:
    @pytest.mark.asyncio
    async def test_get_claims_success(self, mock_http_client, mock_settings):
        operation = ClaimsOperations(
            mock_http_client,
            "user-access-token",
            settings=mock_settings,
        )
        operation._post = AsyncMock(
            return_value=_mock_response(
                {
                    "sub": "user-123",
                    "email": "user@example.com",
                }
            )
        )

        result = await operation.get()

        assert result.claims["sub"] == "user-123"
        operation._post.assert_awaited_once_with(
            "https://idv-data-store.example.com/v1/auth/userinfo",
            scope="idv:auth:userinfo",
            context="idv-data-store userinfo request",
        )

    @pytest.mark.asyncio
    async def test_get_claims_calls_error_handler_on_http_error(
        self,
        mock_http_client,
        mock_settings,
    ):
        operation = ClaimsOperations(
            mock_http_client,
            "user-access-token",
            settings=mock_settings,
        )
        response = _mock_response({"sub": "user-123"})
        response.raise_for_status.side_effect = RuntimeError("boom")
        operation._post = AsyncMock(return_value=response)

        with patch(
            "app.idv_data_store.services.claims_operations.RequestErrorHandler.handle"
        ) as mock_handle:
            result = await operation.get()

        assert result.claims["sub"] == "user-123"
        mock_handle.assert_called_once()

    @pytest.mark.asyncio
    @patch("app.idv_data_store.services.claims_operations.get_configuration")
    async def test_init_uses_get_configuration_when_settings_not_passed(
        self,
        mock_get_configuration,
        mock_http_client,
        mock_settings,
    ):
        mock_get_configuration.return_value = mock_settings
        operation = ClaimsOperations(mock_http_client, "user-access-token")
        operation._post = AsyncMock(return_value=_mock_response({"sub": "user-123"}))

        await operation.get()

        mock_get_configuration.assert_called_once()


class TestOnlineOperations:
    @pytest.mark.asyncio
    async def test_create_case_success(self, mock_http_client, mock_settings):
        operation = OnlineOperations(
            mock_http_client,
            "user-access-token",
            settings=mock_settings,
        )
        operation._post = AsyncMock(
            return_value=_mock_response(
                {
                    "case_id": "case-123",
                    "status": "pending",
                    "online_verification_url": "/start/case-123",
                }
            )
        )

        result = await operation.create_case({"required_by_rp_client_id": "rp-1"})

        assert result.case_id == "case-123"
        assert result.online_verification_url == (
            "https://idv-data-store.example.com/start/case-123"
        )

    @pytest.mark.asyncio
    async def test_create_case_reissues_when_open_case_exists(
        self,
        mock_http_client,
        mock_settings,
    ):
        operation = OnlineOperations(
            mock_http_client,
            "user-access-token",
            settings=mock_settings,
        )
        operation._post = AsyncMock(
            return_value=_mock_response(
                {
                    "detail": {
                        "error": "open_case_exists",
                        "existing_case_id": "case-xyz",
                    }
                },
                status_code=409,
            )
        )
        operation.reissue_session = AsyncMock(
            return_value=ReissueOnlineSessionResponse(
                case_id="case-xyz",
                status="in_progress",
                online_verification_url="https://idv-data-store.example.com/start/case-xyz",
            )
        )

        result = await operation.create_case()

        assert result.case_id == "case-xyz"
        operation.reissue_session.assert_awaited_once_with("case-xyz")

    @pytest.mark.asyncio
    async def test_create_case_calls_error_handler_on_raise_for_status(
        self,
        mock_http_client,
        mock_settings,
    ):
        operation = OnlineOperations(
            mock_http_client,
            "user-access-token",
            settings=mock_settings,
        )
        response = _mock_response(
            {
                "case_id": "case-123",
                "status": "pending",
                "online_verification_url": "/start/case-123",
            },
            status_code=500,
        )
        response.raise_for_status.side_effect = RuntimeError("http error")
        operation._post = AsyncMock(return_value=response)

        with patch(
            "app.idv_data_store.services.online_operations.RequestErrorHandler.handle"
        ) as mock_handle:
            result = await operation.create_case()

        assert result.case_id == "case-123"
        mock_handle.assert_called_once()

    @pytest.mark.asyncio
    async def test_reissue_session_success(self, mock_http_client, mock_settings):
        operation = OnlineOperations(
            mock_http_client,
            "user-access-token",
            settings=mock_settings,
        )
        operation._post = AsyncMock(
            return_value=_mock_response(
                {
                    "case_id": "case-123",
                    "status": "in_progress",
                    "online_verification_url": "/start/case-123?reissued=1",
                }
            )
        )

        result = await operation.reissue_session("case-123")

        assert result.case_id == "case-123"
        assert result.online_verification_url == (
            "https://idv-data-store.example.com/start/case-123?reissued=1"
        )

    def test_resolve_online_verification_url_no_url_keeps_payload(
        self,
        mock_http_client,
        mock_settings,
    ):
        operation = OnlineOperations(
            mock_http_client,
            "user-access-token",
            settings=mock_settings,
        )

        payload = {"case_id": "case-123", "status": "pending"}
        result = operation.resolve_online_verification_url(payload)

        assert result == payload

    @pytest.mark.asyncio
    @patch("app.idv_data_store.services.online_operations.get_configuration")
    async def test_init_uses_get_configuration_when_settings_not_passed(
        self,
        mock_get_configuration,
        mock_http_client,
        mock_settings,
    ):
        mock_get_configuration.return_value = mock_settings
        operation = OnlineOperations(mock_http_client, "user-access-token")
        operation._post = AsyncMock(
            return_value=_mock_response(
                {
                    "case_id": "case-111",
                    "status": "pending",
                    "online_verification_url": "/start/case-111",
                }
            )
        )

        await operation.create_case()

        mock_get_configuration.assert_called_once()
