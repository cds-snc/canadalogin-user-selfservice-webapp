import importlib
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

service_module = importlib.import_module(
    "app.idv_data_store.services.identity_data_service"
)
IdentityDataService = service_module.IdentityDataService

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
MOCK_CONFIGURATION.idv_data_store_in_person_verification_send_endpoint = (
    "https://idv-data-store.example.com/v1/in-person-verification/send"
)
MOCK_CONFIGURATION.idv_data_store_in_person_verification_last_email_endpoint = (
    "https://idv-data-store.example.com/v1/in-person-verification/last-email-sent"
)
MOCK_CONFIGURATION.idv_data_store_userinfo_endpoint = (
    "https://idv-data-store.example.com/v1/auth/userinfo"
)
MOCK_CONFIGURATION.idv_data_store_config.IDV_DATA_STORE_ONLINE_VERIFICATION_SCOPES = (
    "idv:validations:write"
)
MOCK_CONFIGURATION.idv_data_store_config.IDV_DATA_STORE_IN_PERSON_VERIFICATION_SCOPES = (
    "idv:in-person-verification:send"
)
MOCK_CONFIGURATION.idv_data_store_config.IDV_DATA_STORE_AUTH_USERINFO_SCOPES = (
    "idv:auth:userinfo"
)
MOCK_CONFIGURATION.idv_data_store_config.IDV_DATA_STORE_BASE_URL = (
    "https://idv-data-store.example.com"
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


class TestIdentityDataService:
    @pytest.mark.asyncio
    @patch.object(service_module, "get_configuration", return_value=MOCK_CONFIGURATION)
    @patch.object(service_module, "exchange_token_for_idv_data_store")
    async def test_create_identity_verification_case(
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
                    "online_verification_url": "/start/case-123",
                }
            )
        )

        service = IdentityDataService(mock_http_client, "user-access-token")
        result = await service.create_identity_verification_case()

        assert result.case_id == "case-123"
        assert result.online_verification_url == (
            "https://idv-data-store.example.com/start/case-123"
        )
        mock_exchange.assert_awaited_once_with(
            mock_http_client,
            "user-access-token",
            scope="idv:validations:write",
        )

    @pytest.mark.asyncio
    @patch.object(service_module, "get_configuration", return_value=MOCK_CONFIGURATION)
    @patch.object(service_module, "exchange_token_for_idv_data_store")
    @patch.object(service_module.OnlineOperations, "reissue_session")
    async def test_create_identity_verification_case_reissues_open_case(
        self,
        mock_reissue_session,
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
                },
                status_code=409,
            )
        )
        mock_reissue_session.return_value = service_module.ReissueOnlineSessionResponse(
            case_id="64bd14f2-c620-4671-9d94-1cb0192ee552",
            status="in_progress",
            online_verification_url="https://idv-data-store.example.com/start/64bd14f2-c620-4671-9d94-1cb0192ee552",
        )

        service = IdentityDataService(mock_http_client, "user-access-token")
        result = await service.create_identity_verification_case()

        assert result.case_id == "64bd14f2-c620-4671-9d94-1cb0192ee552"
        mock_reissue_session.assert_awaited_once_with(
            "64bd14f2-c620-4671-9d94-1cb0192ee552",
        )

    @pytest.mark.asyncio
    @patch.object(service_module, "get_configuration", return_value=MOCK_CONFIGURATION)
    @patch.object(service_module, "exchange_token_for_idv_data_store")
    async def test_reissue_online_session(
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
                    "online_verification_url": "/start/case-123?reissued=1",
                }
            )
        )

        service = IdentityDataService(mock_http_client, "user-access-token")
        result = await service.online().reissue_session("case-123")

        assert result.case_id == "case-123"
        assert result.online_verification_url == (
            "https://idv-data-store.example.com/start/case-123?reissued=1"
        )

    @pytest.mark.asyncio
    @patch.object(service_module, "get_configuration", return_value=MOCK_CONFIGURATION)
    @patch.object(service_module, "exchange_token_for_idv_data_store")
    async def test_send_in_person_code(
        self,
        mock_exchange,
        mock_get_configuration,
        mock_http_client,
    ):
        mock_exchange.return_value = "idv-scoped-access-token"
        mock_http_client.post = AsyncMock(
            return_value=_mock_response(
                {
                    "success": True,
                    "message": "In-person verification email sent",
                    "data": {"verification_code": "AB12CD34EF"},
                }
            )
        )

        service = IdentityDataService(mock_http_client, "user-access-token")
        result = await service.in_person().send_code()

        assert result.success is True
        assert result.data.verification_code == "AB12CD34EF"

    @pytest.mark.asyncio
    @patch.object(service_module, "get_configuration", return_value=MOCK_CONFIGURATION)
    @patch.object(service_module, "exchange_token_for_idv_data_store")
    async def test_get_userinfo_claims(
        self,
        mock_exchange,
        mock_get_configuration,
        mock_http_client,
    ):
        mock_exchange.return_value = "idv-scoped-access-token"
        mock_http_client.post = AsyncMock(
            return_value=_mock_response(
                {
                    "sub": "user-123",
                    "email": "user@example.com",
                }
            )
        )

        service = IdentityDataService(mock_http_client, "user-access-token")
        result = await service.claims().get()

        assert result.claims["sub"] == "user-123"
        mock_exchange.assert_awaited_once_with(
            mock_http_client,
            "user-access-token",
            scope="idv:auth:userinfo",
        )
