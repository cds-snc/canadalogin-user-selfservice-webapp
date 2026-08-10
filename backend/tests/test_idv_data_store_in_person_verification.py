"""
Unit tests for idv-data-store identity-verification glue services.
"""

import importlib
import pytest
from httpx import AsyncClient, HTTPStatusError, Request, Response
from unittest.mock import AsyncMock, MagicMock, patch

identity_verification_module = importlib.import_module(
    "app.idv_data_store.services.identity_verification"
)
create_in_person_identity_verification_case = (
    identity_verification_module.create_in_person_identity_verification_case
)
get_last_email_sent = identity_verification_module.get_last_email_sent

MOCK_CONFIGURATION = MagicMock()
MOCK_CONFIGURATION.idv_data_store_identity_verification_in_person_endpoint = (
    "https://idv-data-store.example.com/v1/identity-verifications/in-person"
)
MOCK_CONFIGURATION.idv_data_store_in_person_verification_last_email_endpoint = (
    "https://idv-data-store.example.com/v1/in-person-verification/last-email-sent"
)
MOCK_CONFIGURATION.idv_data_store_config.IDV_DATA_STORE_IDENTITY_VERIFICATION_SCOPES = (
    "idv:auth:verified-claims"
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


class TestCreateInPersonIdentityVerificationCase:
    """Tests for create_in_person_identity_verification_case"""

    @pytest.mark.asyncio
    @patch.object(
        identity_verification_module,
        "get_configuration",
        return_value=MOCK_CONFIGURATION,
    )
    @patch.object(identity_verification_module, "exchange_token_for_idv_data_store")
    async def test_success_creates_case_and_returns_mapped_response(
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
                    "verification_code_display": "AB1-2CD-34E",
                    "expires_at": "2026-08-12T20:58:26.760127+00:00",
                }
            )
        )

        result = await create_in_person_identity_verification_case(
            mock_http_client,
            "user-access-token",
            {
                "verification_provider": "service_canada",
                "applicant": {
                    "first_name": "Jane",
                    "last_name": "Doe",
                    "date_of_birth": "1990-05-15",
                },
            },
        )

        assert result.success is True
        assert result.message == "In-person identity verification case created"
        assert result.data["case_id"] == "case-123"
        assert result.data["status"] == "pending"
        assert result.data["verification_code"] == "AB1-2CD-34E"

        mock_exchange.assert_awaited_once_with(
            mock_http_client,
            "user-access-token",
            scope="idv:auth:verified-claims",
        )

        call_args = mock_http_client.post.call_args
        url = call_args[0][0] if call_args[0] else call_args.kwargs.get("url")
        assert (
            url
            == "https://idv-data-store.example.com/v1/identity-verifications/in-person"
        )

        headers = call_args.kwargs.get("headers")
        assert headers["Authorization"] == "Bearer idv-scoped-access-token"
        assert headers["Idempotency-Key"]
        assert call_args.kwargs["json"] == {
            "verification_provider": "service_canada",
            "applicant": {
                "first_name": "Jane",
                "last_name": "Doe",
                "date_of_birth": "1990-05-15",
            },
        }

    @pytest.mark.asyncio
    @patch.object(
        identity_verification_module,
        "get_configuration",
        return_value=MOCK_CONFIGURATION,
    )
    @patch.object(identity_verification_module, "exchange_token_for_idv_data_store")
    async def test_uses_default_payload_when_none_provided(
        self,
        mock_exchange,
        mock_get_configuration,
        mock_http_client,
    ):
        mock_exchange.return_value = "idv-scoped-access-token"
        mock_http_client.post = AsyncMock(return_value=_mock_response({"case_id": "x"}))

        await create_in_person_identity_verification_case(
            mock_http_client,
            "user-access-token",
            None,
        )

        assert mock_http_client.post.call_args.kwargs["json"] == {
            "verification_provider": "service_canada",
            "applicant": {},
        }

    @pytest.mark.asyncio
    @patch.object(
        identity_verification_module,
        "get_configuration",
        return_value=MOCK_CONFIGURATION,
    )
    @patch.object(
        identity_verification_module,
        "exchange_token_for_idv_data_store",
        AsyncMock(return_value="idv-scoped-access-token"),
    )
    @patch.object(identity_verification_module, "RequestErrorHandler")
    async def test_upstream_error_handled(
        self, mock_error_handler, mock_get_configuration, mock_http_client
    ):
        request = Request(
            "POST",
            "https://idv-data-store.example.com/v1/identity-verifications/in-person",
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

        await create_in_person_identity_verification_case(
            mock_http_client,
            "user-access-token",
            {"verification_provider": "service_canada", "applicant": {}},
        )

        mock_error_handler.handle.assert_called_once()


class TestGetLastEmailSent:
    """Tests for get_last_email_sent"""

    @pytest.mark.asyncio
    @patch.object(
        identity_verification_module,
        "get_configuration",
        return_value=MOCK_CONFIGURATION,
    )
    @patch.object(identity_verification_module, "exchange_token_for_idv_data_store")
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
        from app.identity_verification.schemas import (
            CreateInPersonIdentityVerificationRequest,
        )

        mock_request = MagicMock()
        mock_request.app.state.request_client = AsyncMock()

        payload = CreateInPersonIdentityVerificationRequest(
            verification_provider="service_canada"
        )

        expected_response = identity_verification_module.ResponseModel(
            success=True,
            message="In-person identity verification case created",
            data={"verification_code": "AB1-2CD-34E"},
        )

        with patch.object(
            importlib.import_module("app.identity_verification.v1_router"),
            "create_in_person_identity_verification_case",
            AsyncMock(return_value=expected_response),
        ) as mock_create_case:
            result = await send_in_person_verification(
                mock_request, payload, "user-access-token"
            )

        assert result.data["verification_code"] == "AB1-2CD-34E"
        mock_create_case.assert_awaited_once_with(
            mock_request.app.state.request_client,
            "user-access-token",
            payload.model_dump(exclude_none=True),
        )

    @pytest.mark.asyncio
    async def test_get_in_person_last_email_sent_endpoint(self):
        from app.identity_verification.v1_router import get_in_person_last_email_sent

        mock_request = MagicMock()
        mock_request.app.state.request_client = AsyncMock()

        expected_response = identity_verification_module.ResponseModel(
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
