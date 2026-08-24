"""Unit tests for in-person identity verification service and router endpoints."""

import importlib
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from authlib.integrations.starlette_client import OAuthError
from fastapi import HTTPException
from httpx import AsyncClient, Request, Response
from pydantic import ValidationError

identity_verification_module = importlib.import_module(
    "app.identity_verification.services.in_person_identity_verification"
)
create_in_person_identity_verification_case = (
    identity_verification_module.create_in_person_identity_verification_case
)
get_last_email_sent = identity_verification_module.get_last_email_sent

base_module = importlib.import_module(
    "app.identity_verification.services.base_idv_data_store_service"
)

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


def _mock_response(json_data, status_code=200):
    response = MagicMock()
    response.status_code = status_code
    response.json.return_value = json_data
    response.raise_for_status = MagicMock()
    return response


def _httpx_error_response(status_code: int, payload: dict):
    return Response(
        status_code=status_code,
        json=payload,
        request=Request(
            "POST",
            "https://idv-data-store.example.com/v1/identity-verifications/in-person",
        ),
    )


class TestCreateInPersonIdentityVerificationRequestSchema:
    def test_rejects_unknown_verification_provider(self):
        from app.identity_verification.schemas import (
            CreateInPersonIdentityVerificationRequest,
        )

        with pytest.raises(ValidationError):
            CreateInPersonIdentityVerificationRequest(
                verification_provider="unknown_provider",
                applicant={
                    "first_name": "Jane",
                    "last_name": "Doe",
                    "date_of_birth": "1990-05-15",
                    "id_type": "driverLicence",
                    "id_expiry_date": "2030-05-15",
                },
            )

    def test_rejects_invalid_date_fields(self):
        from app.identity_verification.schemas import (
            CreateInPersonIdentityVerificationRequest,
        )

        with pytest.raises(ValidationError):
            CreateInPersonIdentityVerificationRequest(
                verification_provider="service_canada",
                applicant={
                    "first_name": "Jane",
                    "last_name": "Doe",
                    "date_of_birth": "not-a-date",
                    "id_type": "driverLicence",
                    "id_expiry_date": "not-a-date",
                },
            )

    def test_rejects_canada_post_without_address(self):
        from app.identity_verification.schemas import (
            CreateInPersonIdentityVerificationRequest,
        )

        with pytest.raises(ValidationError):
            CreateInPersonIdentityVerificationRequest(
                verification_provider="canada_post",
                applicant={
                    "first_name": "Jane",
                    "last_name": "Doe",
                    "date_of_birth": "1990-05-15",
                    "id_type": "driverLicence",
                    "id_expiry_date": "2030-05-15",
                },
            )

    def test_accepts_canada_post_with_address_object(self):
        from app.identity_verification.schemas import (
            CreateInPersonIdentityVerificationRequest,
        )

        request = CreateInPersonIdentityVerificationRequest(
            verification_provider="canada_post",
            applicant={
                "first_name": "Jane",
                "last_name": "Doe",
                "date_of_birth": "1990-05-15",
                "id_type": "driverLicence",
                "id_expiry_date": "2030-05-15",
                "address": {},
            },
        )

        assert request.applicant.address is not None


class TestCreateInPersonIdentityVerificationCase:
    @pytest.mark.asyncio
    @patch.object(
        identity_verification_module,
        "get_configuration",
        return_value=MOCK_CONFIGURATION,
    )
    @patch.object(base_module, "exchange_token_for_idv_data_store")
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
    @patch.object(base_module, "exchange_token_for_idv_data_store")
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
    @pytest.mark.parametrize(
        "status_code,error_payload,expected_status,expected_detail",
        [
            (400, {"messageId": "BadRequest"}, 400, "BadRequest"),
            (404, {"messageId": "NotFound"}, 404, "NotFound"),
            (429, {"messageId": "TooManyRequests"}, 429, "TooManyRequests"),
            (
                500,
                {"detail": "ServerError"},
                500,
                "idv-data-store in-person identity verification create request failed",
            ),
        ],
    )
    async def test_maps_http_status_errors_to_api_errors(
        self,
        status_code,
        error_payload,
        expected_status,
        expected_detail,
        mock_http_client,
    ):
        with (
            patch.object(
                identity_verification_module,
                "get_configuration",
                return_value=MOCK_CONFIGURATION,
            ),
            patch.object(
                base_module, "exchange_token_for_idv_data_store"
            ) as mock_exchange,
        ):
            mock_exchange.return_value = "idv-scoped-access-token"
            mock_http_client.post = AsyncMock(
                return_value=_httpx_error_response(status_code, error_payload)
            )

            with pytest.raises(HTTPException) as exc_info:
                await create_in_person_identity_verification_case(
                    mock_http_client,
                    "user-access-token",
                    {
                        "verification_provider": "service_canada",
                        "applicant": {
                            "first_name": "Jane",
                            "last_name": "Doe",
                            "date_of_birth": "1990-05-15",
                            "id_type": "driverLicence",
                            "id_expiry_date": "2030-05-15",
                        },
                    },
                )

        assert exc_info.value.status_code == expected_status
        assert expected_detail in str(exc_info.value.detail)

    @pytest.mark.asyncio
    @patch.object(
        identity_verification_module,
        "get_configuration",
        return_value=MOCK_CONFIGURATION,
    )
    @patch.object(base_module, "exchange_token_for_idv_data_store")
    async def test_maps_401_to_oauth_error(
        self,
        mock_exchange,
        mock_get_configuration,
        mock_http_client,
    ):
        mock_exchange.return_value = "idv-scoped-access-token"
        mock_http_client.post = AsyncMock(
            return_value=_httpx_error_response(401, {"messageId": "Unauthorized"})
        )

        with pytest.raises(OAuthError):
            await create_in_person_identity_verification_case(
                mock_http_client,
                "user-access-token",
                {
                    "verification_provider": "service_canada",
                    "applicant": {
                        "first_name": "Jane",
                        "last_name": "Doe",
                        "date_of_birth": "1990-05-15",
                        "id_type": "driverLicence",
                        "id_expiry_date": "2030-05-15",
                    },
                },
            )


class TestGetLastEmailSent:
    @pytest.mark.asyncio
    @patch.object(
        identity_verification_module,
        "get_configuration",
        return_value=MOCK_CONFIGURATION,
    )
    @patch.object(base_module, "exchange_token_for_idv_data_store")
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


class TestInPersonVerificationRouterEndpoints:
    @pytest.mark.asyncio
    async def test_send_in_person_verification_endpoint(self):
        from app.identity_verification.schemas import (
            CreateInPersonIdentityVerificationRequest,
        )
        from app.identity_verification.v1_router import send_in_person_verification

        mock_request = MagicMock()
        mock_request.app.state.request_client = AsyncMock()

        payload = CreateInPersonIdentityVerificationRequest(
            verification_provider="service_canada",
            applicant={
                "first_name": "Jane",
                "last_name": "Doe",
                "date_of_birth": "1990-05-15",
                "id_type": "driverLicence",
                "id_expiry_date": "2030-05-15",
            },
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
            payload.model_dump(mode="json", exclude_none=True),
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
