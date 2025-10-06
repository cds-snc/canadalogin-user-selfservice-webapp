"""
Tests for the unified MFA OTP verification functions.

These tests verify the refactored unified functions that accept OTP type parameters
instead of having separate SMS and Voice functions.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.otp.schemas import (
    OtpType,
    OtpVerificationAttemptRequest,
    OtpVerificationCreateRequest,
)
from app.users.schemas import IBMVerifyUserProfileSchema, ProfileResponse

from backend.app.otp.services.verify_mfa_otp import (
    dispatch_mfa_verification_create,
    handle_mfa_otp_verification_attempt,
    handle_mfa_otp_verification_create,
)


@pytest.fixture
def mock_verification_create_request():
    return OtpVerificationCreateRequest(id="factor123")


@pytest.fixture
def mock_verification_attempt_request():
    return OtpVerificationAttemptRequest(
        id="factor123", trxnId="verification123", otp="123456"
    )


@pytest.fixture
def mock_user_profile_response():
    from datetime import datetime

    from app.users.schemas import Meta, UserProfileName

    user_profile = IBMVerifyUserProfileSchema(
        id="user123",
        userName="test@example.com",
        name=UserProfileName(givenName="Test", familyName="User"),
        phoneNumbers=[],
        emails=[],
        active=True,
        meta=Meta(
            created=datetime.now(),
            location="test",
            lastModified=datetime.now(),
            resourceType="User",
        ),
    )

    return ProfileResponse(
        success=True,
        data=user_profile,
        message="Profile retrieved successfully",
    )


@pytest.fixture
def mock_ibm_verification_create_response():
    return {
        "id": "verification123",
        "userId": "user123",
        "type": "SMS",
        "created": "2024-01-01T00:00:00Z",
        "updated": "2024-01-01T00:00:00Z",
        "expiry": "2024-01-01T00:05:00Z",
        "state": "PENDING",
        "updatedBy": "system",
        "correlation": "correlation123",
        "phoneNumber": "+1234567890",
        "attempts": 0,
        "retries": 3,
    }


class TestUnifiedMFAOTPVerificationCreate:
    """Test the unified MFA OTP verification create function."""

    @pytest.mark.asyncio
    async def test_handle_mfa_otp_verification_create_sms_success(
        self,
        mock_verification_create_request,
        mock_user_profile_response,
        mock_ibm_verification_create_response,
    ):
        """Test successful SMS MFA OTP verification creation."""
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_mfa_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_mfa_otp.dispatch_mfa_verification_create"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.json.return_value = mock_ibm_verification_create_response
                mock_dispatch.return_value = mock_response

                result = await handle_mfa_otp_verification_create(
                    mock_http_client,
                    mock_verification_create_request,
                    mock_user_access_token,
                    OtpType.SMS,
                )

                assert result.success is True
                assert result.data.id == "verification123"
                assert result.data.userId == "user123"
                assert result.data.state == "PENDING"
                assert result.message == "SMS MFA OTP verification created successfully"
                mock_dispatch.assert_called_once_with(
                    mock_http_client, mock_verification_create_request, OtpType.SMS
                )

    @pytest.mark.asyncio
    async def test_handle_mfa_otp_verification_create_voice_success(
        self,
        mock_verification_create_request,
        mock_user_profile_response,
        mock_ibm_verification_create_response,
    ):
        """Test successful Voice MFA OTP verification creation."""
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_mfa_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_mfa_otp.dispatch_mfa_verification_create"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.json.return_value = mock_ibm_verification_create_response
                mock_dispatch.return_value = mock_response

                result = await handle_mfa_otp_verification_create(
                    mock_http_client,
                    mock_verification_create_request,
                    mock_user_access_token,
                    OtpType.VOICE,
                )

                assert result.success is True
                assert result.data.id == "verification123"
                assert (
                    result.message == "VOICE MFA OTP verification created successfully"
                )
                mock_dispatch.assert_called_once_with(
                    mock_http_client, mock_verification_create_request, OtpType.VOICE
                )

    @pytest.mark.asyncio
    async def test_handle_mfa_otp_verification_create_profile_failure(
        self, mock_verification_create_request
    ):
        """Test MFA OTP verification creation with profile failure."""
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        failed_profile_response = ProfileResponse(
            success=False, data=None, message="Profile retrieval failed"
        )

        with patch("app.otp.services.verify_mfa_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = failed_profile_response

            result = await handle_mfa_otp_verification_create(
                mock_http_client,
                mock_verification_create_request,
                mock_user_access_token,
                OtpType.SMS,
            )

            assert result.success is False
            assert result.message == "User verification failed"


class TestUnifiedMFAOTPVerificationAttempt:
    """Test the unified MFA OTP verification attempt function."""

    @pytest.mark.asyncio
    async def test_handle_mfa_otp_verification_attempt_sms_success(
        self, mock_verification_attempt_request, mock_user_profile_response
    ):
        """Test successful SMS MFA OTP verification attempt."""
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_mfa_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_mfa_otp.dispatch_mfa_verification_attempt"
            ) as mock_dispatch:
                result = await handle_mfa_otp_verification_attempt(
                    mock_http_client,
                    mock_verification_attempt_request,
                    mock_user_access_token,
                    OtpType.SMS,
                )

                assert result.success is True
                assert (
                    result.message == "SMS MFA OTP verification completed successfully"
                )
                mock_dispatch.assert_called_once_with(
                    mock_http_client, mock_verification_attempt_request, OtpType.SMS
                )

    @pytest.mark.asyncio
    async def test_handle_mfa_otp_verification_attempt_voice_success(
        self, mock_verification_attempt_request, mock_user_profile_response
    ):
        """Test successful Voice MFA OTP verification attempt."""
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_mfa_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_mfa_otp.dispatch_mfa_verification_attempt"
            ) as mock_dispatch:
                result = await handle_mfa_otp_verification_attempt(
                    mock_http_client,
                    mock_verification_attempt_request,
                    mock_user_access_token,
                    OtpType.VOICE,
                )

                assert result.success is True
                assert (
                    result.message
                    == "VOICE MFA OTP verification completed successfully"
                )
                mock_dispatch.assert_called_once_with(
                    mock_http_client, mock_verification_attempt_request, OtpType.VOICE
                )


class TestUnifiedMFAOTPDispatchFunctions:
    """Test the unified dispatch functions."""

    @pytest.mark.asyncio
    async def test_dispatch_mfa_verification_create_sms(
        self, mock_verification_create_request
    ):
        """Test SMS dispatch verification create."""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_mfa_otp.get_admin_token") as mock_get_token:
            mock_get_token.return_value = "admin_token"

            with patch(
                "app.otp.services.verify_mfa_otp.get_auth_request_headers"
            ) as mock_headers:
                mock_headers.return_value = {"Authorization": "Bearer admin_token"}

                with patch(
                    "app.otp.services.verify_mfa_otp.get_configuration"
                ) as mock_config:
                    mock_config.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
                        "https://test.ibm.com"
                    )

                    mock_response = MagicMock()
                    mock_response.raise_for_status = MagicMock()
                    mock_http_client.post.return_value = mock_response

                    result = await dispatch_mfa_verification_create(
                        mock_http_client, mock_verification_create_request, OtpType.SMS
                    )

                    assert result == mock_response
                    mock_http_client.post.assert_called_once()
                    call_args = mock_http_client.post.call_args
                    assert "/v2.0/factors/smsotp/" in call_args[0][0]

    @pytest.mark.asyncio
    async def test_dispatch_mfa_verification_create_voice(
        self, mock_verification_create_request
    ):
        """Test Voice dispatch verification create."""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_mfa_otp.get_admin_token") as mock_get_token:
            mock_get_token.return_value = "admin_token"

            with patch(
                "app.otp.services.verify_mfa_otp.get_auth_request_headers"
            ) as mock_headers:
                mock_headers.return_value = {"Authorization": "Bearer admin_token"}

                with patch(
                    "app.otp.services.verify_mfa_otp.get_configuration"
                ) as mock_config:
                    mock_config.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
                        "https://test.ibm.com"
                    )

                    mock_response = MagicMock()
                    mock_response.raise_for_status = MagicMock()
                    mock_http_client.post.return_value = mock_response

                    result = await dispatch_mfa_verification_create(
                        mock_http_client,
                        mock_verification_create_request,
                        OtpType.VOICE,
                    )

                    assert result == mock_response
                    mock_http_client.post.assert_called_once()
                    call_args = mock_http_client.post.call_args
                    assert "/v2.0/factors/voiceotp/" in call_args[0][0]

    @pytest.mark.asyncio
    async def test_dispatch_mfa_verification_create_unsupported_type(
        self, mock_verification_create_request
    ):
        """Test dispatch verification create with unsupported OTP type."""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_mfa_otp.get_admin_token") as mock_get_token:
            mock_get_token.return_value = "admin_token"

            with patch(
                "app.otp.services.verify_mfa_otp.get_auth_request_headers"
            ) as mock_headers:
                mock_headers.return_value = {"Authorization": "Bearer admin_token"}

                with patch(
                    "app.otp.services.verify_mfa_otp.get_configuration"
                ) as mock_config:
                    mock_config.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
                        "https://test.ibm.com"
                    )

                    with patch(
                        "app.otp.services.verify_mfa_otp.RequestErrorHandler.handle"
                    ) as mock_handler:
                        await dispatch_mfa_verification_create(
                            mock_http_client,
                            mock_verification_create_request,
                            OtpType.EMAIL,
                        )

                        mock_handler.assert_called_once()
                        # Verify that the ValueError was passed to the error handler
                        call_args = mock_handler.call_args[0]
                        assert isinstance(call_args[0], ValueError)
                        assert "Unsupported OTP type: EMAIL" in str(call_args[0])
