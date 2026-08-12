"""
Unit tests for the idv-data-store in-person-verification glue service
(app.idv_data_store.services.in_person_verification).
"""

import importlib
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, MagicMock, patch

from app.idv_data_store.services.schemas import (
    InPersonVerificationResponse,
    LastEmailSentResponse,
)

in_person_verification_module = importlib.import_module(
    "app.idv_data_store.services.in_person_verification"
)
send_in_person_verification_code = (
    in_person_verification_module.send_in_person_verification_code
)
get_last_email_sent = in_person_verification_module.get_last_email_sent


@pytest.fixture
def mock_http_client():
    return AsyncMock(spec=AsyncClient)


class TestSendInPersonVerificationCode:
    """Tests for send_in_person_verification_code"""

    @pytest.mark.asyncio
    @patch.object(in_person_verification_module, "IdentityDataService")
    async def test_success_sends_code_and_returns_response(
        self,
        mock_service_class,
        mock_http_client,
    ):
        mock_service = MagicMock()
        mock_service.in_person.return_value.send_code = AsyncMock(
            return_value=InPersonVerificationResponse(
                success=True,
                message="In-person verification email sent",
                data={"verification_code": "AB12CD34EF"},
            )
        )
        mock_service_class.return_value = mock_service

        result = await send_in_person_verification_code(
            mock_http_client, "user-access-token"
        )

        assert result.success is True
        assert result.message == "In-person verification email sent"
        assert result.data["verification_code"] == "AB12CD34EF"
        mock_service_class.assert_called_once_with(
            mock_http_client, "user-access-token"
        )

    @pytest.mark.asyncio
    @patch.object(in_person_verification_module, "IdentityDataService")
    async def test_upstream_error_bubbles(self, mock_service_class, mock_http_client):
        mock_service = MagicMock()
        mock_service.in_person.return_value.send_code = AsyncMock(
            side_effect=RuntimeError("boom")
        )
        mock_service_class.return_value = mock_service

        with pytest.raises(RuntimeError, match="boom"):
            await send_in_person_verification_code(
                mock_http_client, "user-access-token"
            )


class TestGetLastEmailSent:
    """Tests for get_last_email_sent"""

    @pytest.mark.asyncio
    @patch.object(in_person_verification_module, "IdentityDataService")
    async def test_success_returns_last_email_sent(
        self,
        mock_service_class,
        mock_http_client,
    ):
        mock_service = MagicMock()
        mock_service.in_person.return_value.get_last_email_sent = AsyncMock(
            return_value=LastEmailSentResponse(
                success=True,
                message="Last email sent date retrieved",
                data={"last_email_sent": None},
            )
        )
        mock_service_class.return_value = mock_service

        result = await get_last_email_sent(mock_http_client, "user-access-token")

        assert result.success is True
        assert result.data["last_email_sent"] is None


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
