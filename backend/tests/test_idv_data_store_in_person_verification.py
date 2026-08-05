"""
Unit tests for the idv-data-store in-person-verification glue service
(app.idv_data_store.services.in_person_verification).
"""

import importlib
import pytest
from httpx import AsyncClient, HTTPStatusError, Request, Response
from unittest.mock import AsyncMock, MagicMock, patch

in_person_verification_module = importlib.import_module(
    "app.idv_data_store.services.in_person_verification"
)
send_in_person_verification_code = (
    in_person_verification_module.send_in_person_verification_code
)
get_last_email_sent = in_person_verification_module.get_last_email_sent

MOCK_CONFIGURATION = MagicMock()
MOCK_CONFIGURATION.idv_data_store_in_person_verification_send_endpoint = (
    "https://idv-data-store.example.com/v1/in-person-verification/send"
)
MOCK_CONFIGURATION.idv_data_store_in_person_verification_last_email_endpoint = (
    "https://idv-data-store.example.com/v1/in-person-verification/last-email-sent"
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


class TestSendInPersonVerificationCode:
    """Tests for send_in_person_verification_code"""

    @pytest.mark.asyncio
    @patch.object(
        in_person_verification_module,
        "get_configuration",
        return_value=MOCK_CONFIGURATION,
    )
    @patch.object(in_person_verification_module, "exchange_token_for_idv_data_store")
    async def test_success_sends_code_and_returns_response(
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

        result = await send_in_person_verification_code(
            mock_http_client, "user-access-token"
        )

        assert result.success is True
        assert result.message == "In-person verification email sent"
        assert result.data["verification_code"] == "AB12CD34EF"

        mock_exchange.assert_awaited_once_with(
            mock_http_client,
            "user-access-token",
            scope="idv:in-person-verification:send",
        )

        call_args = mock_http_client.post.call_args
        url = call_args[0][0] if call_args[0] else call_args.kwargs.get("url")
        assert (
            url == "https://idv-data-store.example.com/v1/in-person-verification/send"
        )

        assert "json" not in call_args.kwargs

        headers = call_args.kwargs.get("headers")
        assert headers["Authorization"] == "Bearer idv-scoped-access-token"

    @pytest.mark.asyncio
    @patch.object(
        in_person_verification_module,
        "get_configuration",
        return_value=MOCK_CONFIGURATION,
    )
    @patch.object(
        in_person_verification_module,
        "exchange_token_for_idv_data_store",
        AsyncMock(return_value="idv-scoped-access-token"),
    )
    @patch.object(in_person_verification_module, "RequestErrorHandler")
    async def test_upstream_error_handled(
        self, mock_error_handler, mock_get_configuration, mock_http_client
    ):
        request = Request(
            "POST",
            "https://idv-data-store.example.com/v1/in-person-verification/send",
        )
        error_response = Response(
            429, request=request, json={"messageId": "TooManyRequests"}
        )
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "success": False,
            "message": "Too many requests",
            "data": None,
        }
        mock_response.raise_for_status = MagicMock(
            side_effect=HTTPStatusError(
                "error", request=request, response=error_response
            )
        )
        mock_http_client.post = AsyncMock(return_value=mock_response)

        await send_in_person_verification_code(mock_http_client, "user-access-token")

        mock_error_handler.handle.assert_called_once()


class TestGetLastEmailSent:
    """Tests for get_last_email_sent"""

    @pytest.mark.asyncio
    @patch.object(
        in_person_verification_module,
        "get_configuration",
        return_value=MOCK_CONFIGURATION,
    )
    @patch.object(in_person_verification_module, "exchange_token_for_idv_data_store")
    async def test_success_returns_last_email_sent(
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
                    "message": "Last email sent date retrieved",
                    "data": {"last_email_sent": None},
                }
            )
        )

        result = await get_last_email_sent(mock_http_client, "user-access-token")

        assert result.success is True
        assert result.data["last_email_sent"] is None

        call_args = mock_http_client.post.call_args
        url = call_args[0][0] if call_args[0] else call_args.kwargs.get("url")
        assert (
            url
            == "https://idv-data-store.example.com/v1/in-person-verification/last-email-sent"
        )


class TestInPersonVerificationRouterEndpoints:
    """Tests for the /identity-verification/in-person* router endpoints."""

    @pytest.mark.asyncio
    async def test_send_in_person_verification_endpoint(self):
        from app.identity_verification.v1_router import send_in_person_verification

        mock_request = MagicMock()
        mock_request.app.state.request_client = AsyncMock()

        expected_response = in_person_verification_module.ResponseModel(
            success=True,
            message="In-person verification email sent",
            data={"verification_code": "AB12CD34EF"},
        )

        with patch.object(
            importlib.import_module("app.identity_verification.v1_router"),
            "send_in_person_verification_code",
            AsyncMock(return_value=expected_response),
        ):
            result = await send_in_person_verification(
                mock_request, "user-access-token"
            )

        assert result.data["verification_code"] == "AB12CD34EF"

    @pytest.mark.asyncio
    async def test_get_in_person_last_email_sent_endpoint(self):
        from app.identity_verification.v1_router import get_in_person_last_email_sent

        mock_request = MagicMock()
        mock_request.app.state.request_client = AsyncMock()

        expected_response = in_person_verification_module.ResponseModel(
            success=True,
            message="Last email sent date retrieved",
            data={"last_email_sent": None},
        )

        with patch.object(
            importlib.import_module("app.identity_verification.v1_router"),
            "get_last_email_sent",
            AsyncMock(return_value=expected_response),
        ):
            result = await get_in_person_last_email_sent(
                mock_request, "user-access-token"
            )

        assert result.data["last_email_sent"] is None
