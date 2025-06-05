from unittest.mock import patch, AsyncMock, MagicMock

import pytest
from httpx import AsyncClient

from app.users.schemas import NewUserCreationData
from app.users.services.otp_verified_check import otp_method_is_verified


from app.users.services import otp_verified_check


@pytest.mark.asyncio
async def test_patch_get_admin_token():
    with patch(
        "app.users.services.otp_verified_check.get_admin_token",
        new=AsyncMock(return_value="fake-token"),
    ):
        token = await otp_verified_check.get_admin_token(None)
        assert token == "fake-token"


@pytest.mark.asyncio
async def test_otp_method_is_verified_not():
    user_data = NewUserCreationData(userName="user@abc.com", password="pass", trxnId="")

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": "1e5fa156-3754-4265-8796-1a2f0a6f036f",
        "type": "smsotp",
        "created": "2018-07-16T02:13:47.719Z",
        "updated": "2018-07-16T02:13:47.719Z",
        "expiry": "2018-07-16T02:13:47.719Z",
        "state": "PENDING",
        "updatedBy": "50CP15KFD3",
        "correlation": "4567",
        "phoneNumber": "+15345678911",
        "attempts": 0,
        "retries": 4,
    }

    with (
        patch(
            "app.users.services.otp_verified_check.get_admin_token",
            new=AsyncMock(return_value="fake-token"),
        ),
        patch(
            "app.users.services.otp_verified_check.get_auth_request_headers"
        ) as mock_headers,
        patch("app.users.services.otp_verified_check.get_settings") as mock_settings,
        patch("app.users.services.otp_verified_check.AsyncClient") as mock_client_class,
    ):
        mock_headers.return_value = {"Authorization": "Bearer fake-token"}
        mock_settings.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
            "https://fake.ibm.com"
        )

        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.__aenter__.return_value = mock_client
        mock_client.get.return_value = mock_response
        mock_client_class.return_value = mock_client

        result = await otp_method_is_verified(mock_client, user_data, None)

    assert result is False

@pytest.mark.asyncio
async def test_otp_method_is_verified():
    user_data = NewUserCreationData(userName="user@abc.com", password="pass", trxnId="")

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": "1e5fa156-3754-4265-8796-1a2f0a6f036f",
        "type": "smsotp",
        "created": "2018-07-16T02:13:47.719Z",
        "updated": "2018-07-16T02:13:47.719Z",
        "expiry": "2018-07-16T02:13:47.719Z",
        "state": "SUCCESS",
        "updatedBy": "50CP15KFD3",
        "correlation": "4567",
        "phoneNumber": "+15345678911",
        "attempts": 0,
        "retries": 4,
    }

    with (
        patch(
            "app.users.services.otp_verified_check.get_admin_token",
            new=AsyncMock(return_value="fake-token"),
        ),
        patch(
            "app.users.services.otp_verified_check.get_auth_request_headers"
        ) as mock_headers,
        patch("app.users.services.otp_verified_check.get_settings") as mock_settings,
        patch("app.users.services.otp_verified_check.AsyncClient") as mock_client_class,
    ):
        mock_headers.return_value = {"Authorization": "Bearer fake-token"}
        mock_settings.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
            "https://fake.ibm.com"
        )

        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.__aenter__.return_value = mock_client
        mock_client.get.return_value = mock_response
        mock_client_class.return_value = mock_client

        result = await otp_method_is_verified(mock_client, user_data, None)
    assert result is True
