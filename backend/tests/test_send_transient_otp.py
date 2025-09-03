from unittest.mock import patch, AsyncMock, MagicMock
import pytest
from httpx import AsyncClient
from app.otp.schemas import OtpType, UserOtpInfo
from app.otp.services.send_transient_otp import handle_otp_send, dispatch_otp


@pytest.mark.asyncio
async def test_handle_otp_send_success():
    mock_response = MagicMock()
    mock_response.status_code = 201
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

    user = UserOtpInfo(
        phoneNumber="+19025555555",
        userName="testUser@testUser.com",
        otpType=OtpType.SMS,
    )

    with (
        patch(
            "app.otp.services.send_transient_otp.dispatch_otp",
            return_value=mock_response,
        ) as dispatcher,
    ):
        response = await handle_otp_send(user, global_http_client=AsyncMock())
        dispatcher.assert_called_once()
        assert response.success
        assert response.data


@pytest.mark.asyncio
async def test_handle_otp_send_error():
    mock_response = MagicMock()
    mock_response.status_code = 400
    mock_response.json.return_value = {"error": "Invalid request"}

    user = UserOtpInfo(
        phoneNumber="+19025555555",
        userName="testUser@testUser.com",
        otpType=OtpType.SMS,
    )

    with patch(
        "app.otp.services.send_transient_otp.dispatch_otp", return_value=mock_response
    ) as dispatcher:
        response = await handle_otp_send(user, global_http_client=AsyncMock())
        dispatcher.assert_called_once()
        assert (
            not response.success
        )  # Validate the `success` attribute of the ResponseModel
        assert response.message == "Invalid request"


@pytest.mark.asyncio
async def test_dispatch_otp_sms():
    user = UserOtpInfo(
        phoneNumber="+19025555555",
        userName="testUser@testUser.com",
        otpType=OtpType.SMS,
    )

    with (
        patch(
            "app.otp.services.send_transient_otp.get_auth_request_headers"
        ) as mock_headers,
        patch("app.otp.services.send_transient_otp.get_configuration") as mock_settings,
        patch("app.otp.services.send_transient_otp.AsyncClient") as mock_client_class,
    ):
        mock_headers.return_value = {"Authorization": "Bearer fake-token"}
        mock_settings.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
            "https://fake.ibm.com"
        )

        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.__aenter__.return_value = mock_client
        mock_client.post.return_value.status_code = 201
        mock_client_class.return_value = mock_client

        response = await dispatch_otp(user, mock_client)
        mock_client.post.assert_called_once_with(
            "https://fake.ibm.com/v2.0/factors/smsotp/transient/verifications",
            json={"phoneNumber": "19025555555"},  # Ensure consistent formatting
            headers={"Authorization": "Bearer fake-token"},
        )
        assert response.status_code == 201


@pytest.mark.asyncio
async def test_dispatch_otp_email():
    user = UserOtpInfo(
        phoneNumber=None,
        userName="TestUser@TestUser.com",  # Test case with inconsistent email casing
        otpType=OtpType.EMAIL,
    )

    with (
        patch(
            "app.otp.services.send_transient_otp.get_auth_request_headers"
        ) as mock_headers,
        patch("app.otp.services.send_transient_otp.get_configuration") as mock_settings,
        patch("app.otp.services.send_transient_otp.AsyncClient") as mock_client_class,
    ):
        mock_headers.return_value = {"Authorization": "Bearer fake-token"}
        mock_settings.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
            "https://fake.ibm.com"
        )

        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.__aenter__.return_value = mock_client
        mock_client.post.return_value.status_code = 201
        mock_client_class.return_value = mock_client

        response = await dispatch_otp(user, mock_client)
        mock_client.post.assert_called_once_with(
            "https://fake.ibm.com/v2.0/factors/emailotp/transient/verifications",
            json={
                "emailAddress": "testuser@testuser.com"
            },  # Ensure consistent formatting
            headers={"Authorization": "Bearer fake-token"},
        )
        assert response.status_code == 201


@pytest.mark.asyncio
async def test_dispatch_otp_error():
    user = UserOtpInfo(
        phoneNumber=None,
        userName="testUser@testUser.com",
        otpType=OtpType.EMAIL,
    )

    with (
        patch(
            "app.otp.services.send_transient_otp.get_auth_request_headers"
        ) as mock_headers,
        patch("app.otp.services.send_transient_otp.get_configuration") as mock_settings,
        patch("app.otp.services.send_transient_otp.AsyncClient") as mock_client_class,
    ):
        mock_headers.return_value = {"Authorization": "Bearer fake-token"}
        mock_settings.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
            "https://fake.ibm.com"
        )

        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.__aenter__.return_value = mock_client
        mock_client.post.side_effect = Exception("Test exception")
        mock_client_class.return_value = mock_client

        with pytest.raises(Exception, match="Test exception"):
            await dispatch_otp(user, mock_client)
