from unittest.mock import patch, AsyncMock, MagicMock
import pytest
from httpx import AsyncClient
from fastapi import HTTPException
from app.otp.schemas import OtpType, UserOtpInfo
from app.otp.services.send_transient_otp import (
    handle_otp_send,
    dispatch_otp,
)


@pytest.mark.asyncio
async def test_handle_otp_send_success():
    user = UserOtpInfo(
        phoneNumber="+19025555555",
        userName="testUser@testUser.com",
        otpType=OtpType.SMS,
    )

    # Mock my_profile response with matching userName
    mock_profile_response = MagicMock()
    mock_profile_response.data = MagicMock()
    mock_profile_response.data.userName = user.userName

    # Mock dispatch_otp response (successful)
    mock_dispatch_response = MagicMock()
    mock_dispatch_response.status_code = 201
    mock_dispatch_response.json.return_value = {
        "id": "some-id",
        "type": "smsotp",
        "state": "PENDING",
        "correlation": "correlation-id",
        "phoneNumber": user.phoneNumber,
        "created": "2025-09-11T10:00:00Z",
        "updated": "2025-09-11T10:01:00Z",
        "expiry": "2025-09-11T10:05:00Z",
        "attempts": 0,
        "retries": 0,
    }
    with (
        patch(
            "app.otp.services.send_transient_otp.my_profile", new_callable=AsyncMock
        ) as mock_my_profile,
        patch(
            "app.otp.services.send_transient_otp.dispatch_otp", new_callable=AsyncMock
        ) as mock_dispatch_otp,
    ):

        mock_my_profile.return_value = mock_profile_response
        mock_dispatch_otp.return_value = mock_dispatch_response

        response = await handle_otp_send(AsyncMock(), user, "fake-token")

        mock_my_profile.assert_called_once()
        mock_dispatch_otp.assert_called_once()
        assert response.success is True
        assert response.data.phoneNumber == user.phoneNumber


@pytest.mark.asyncio
async def test_handle_otp_send_error():
    user = UserOtpInfo(
        phoneNumber="+19025555555",
        userName="testUser@testUser.com",
        otpType=OtpType.SMS,
    )

    # Mock my_profile response with matching userName
    mock_profile_response = MagicMock()
    mock_profile_response.data = MagicMock()
    mock_profile_response.data.userName = user.userName

    # Mock dispatch_otp response with error code != 201
    mock_dispatch_response = MagicMock()
    mock_dispatch_response.status_code = 400
    mock_dispatch_response.json.return_value = {"error": "Invalid request"}

    with (
        patch(
            "app.otp.services.send_transient_otp.my_profile", new_callable=AsyncMock
        ) as mock_my_profile,
        patch(
            "app.otp.services.send_transient_otp.dispatch_otp", new_callable=AsyncMock
        ) as mock_dispatch_otp,
    ):

        mock_my_profile.return_value = mock_profile_response
        mock_dispatch_otp.return_value = mock_dispatch_response

        response = await handle_otp_send(AsyncMock(), user, "fake-token")

        mock_my_profile.assert_called_once()
        mock_dispatch_otp.assert_called_once()
        assert response.success is False
        assert response.message == "Invalid request"


@pytest.mark.asyncio
async def test_handle_otp_send_user_mismatch():
    user = UserOtpInfo(
        phoneNumber="+19025555555",
        userName="testUser@testUser.com",
        otpType=OtpType.SMS,
    )

    # Mock my_profile response with DIFFERENT userName (user mismatch)
    mock_profile_response = MagicMock()
    mock_profile_response.data = MagicMock()
    mock_profile_response.data.userName = "otherUser@testUser.com"

    with (
        patch(
            "app.otp.services.send_transient_otp.my_profile", new_callable=AsyncMock
        ) as mock_my_profile,
        patch(
            "app.otp.services.send_transient_otp.dispatch_otp", new_callable=AsyncMock
        ) as mock_dispatch_otp,
    ):

        mock_my_profile.return_value = mock_profile_response

        response = await handle_otp_send(AsyncMock(), user, "fake-token")

        mock_my_profile.assert_called_once()
        mock_dispatch_otp.assert_not_called()

        assert response.status_code == 403
        assert "User mismatch" in response.body.decode()


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
        mock_client.post.side_effect = [
            MagicMock(
                status_code=200,
                json=MagicMock(return_value={"access_token": "fake-token"}),
            ),  # Mock token request
            MagicMock(status_code=201),  # Mock OTP request
        ]
        mock_client_class.return_value = mock_client

        response = await dispatch_otp(mock_client, user)
        mock_client.post.assert_called_with(
            "https://fake.ibm.com/v2.0/factors/smsotp/transient/verifications",
            json={"phoneNumber": "19025555555"},
            headers={"Authorization": "Bearer fake-token"},
        )
        assert response.status_code == 201


@pytest.mark.asyncio
async def test_dispatch_otp_email():
    user = UserOtpInfo(
        phoneNumber=None,
        userName="TestUser@TestUser.com",
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
        mock_client.post.side_effect = [
            MagicMock(
                status_code=200,
                json=AsyncMock(return_value={"access_token": "fake-token"}),
            ),  # Mock token request
            MagicMock(status_code=201),  # Mock OTP request
        ]

        # Mock token response with synchronous .json()
        mock_token_response = MagicMock()
        mock_token_response.status_code = 200
        mock_token_response.json.return_value = {"access_token": "fake-token"}

        # Mock OTP send response
        mock_otp_response = MagicMock()
        mock_otp_response.status_code = 201

        mock_client.post.side_effect = [
            mock_token_response,  # token request response
            mock_otp_response,  # otp send response
        ]

        mock_client_class.return_value = mock_client

        response = await dispatch_otp(mock_client, user)
        mock_client.post.assert_called_with(
            "https://fake.ibm.com/v2.0/factors/emailotp/transient/verifications",
            json={"emailAddress": "testuser@testuser.com"},
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
        mock_client.post.side_effect = HTTPException(
            status_code=500, detail="Unexpected API request error"
        )  # Simulate HTTPException
        mock_client_class.return_value = mock_client

        with pytest.raises(HTTPException, match="Unexpected API request error"):
            await dispatch_otp(mock_client, user)
