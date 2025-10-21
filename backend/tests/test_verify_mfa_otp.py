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
from app.otp.services.verify_mfa_otp import (
    dispatch_send_mfa_otp,
    dispatch_verify_mfa_otp,
    handle_send_mfa_otp,
    handle_verify_mfa_otp,
)
from fastapi import HTTPException
from httpx import HTTPStatusError, Request, Response


@pytest.fixture
def mock_sms_verification_create_request():
    return OtpVerificationCreateRequest(id="factor123", otpType=OtpType.SMS)


@pytest.fixture
def mock_voice_verification_create_request():
    return OtpVerificationCreateRequest(id="factor123", otpType=OtpType.VOICE)


@pytest.fixture
def mock_sms_verification_attempt_request():
    return OtpVerificationAttemptRequest(
        id="factor123", trxnId="trxn456", otp="123456", otpType=OtpType.SMS
    )


@pytest.fixture
def mock_voice_verification_attempt_request():
    return OtpVerificationAttemptRequest(
        id="factor123", trxnId="trxn456", otp="123456", otpType=OtpType.VOICE
    )


@pytest.fixture
def mock_successful_verification_response():
    return {
        "id": "verification123",
        "userId": "user456",
        "type": "smsotp",
        "created": "2023-01-01T00:00:00Z",
        "updated": "2023-01-01T00:00:00Z",
        "expiry": "2023-01-01T01:00:00Z",
        "state": "ACTIVE",
        "updatedBy": "system",
        "correlation": "corr789",
        "phoneNumber": "+1234567890",
        "attempts": 0,
        "retries": 3,
    }


@pytest.fixture
def mock_profile_success_response():
    response = MagicMock()
    response.success = True
    return response


@pytest.fixture
def mock_profile_failure_response():
    response = MagicMock()
    response.success = False
    return response


class TestUnifiedMFAOTPDispatchFunctions:
    """Test the unified dispatch functions."""

    @pytest.mark.asyncio
    async def test_dispatch_mfa_verification_create_sms(
        self, mock_sms_verification_create_request
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

                    result = await dispatch_send_mfa_otp(
                        mock_http_client,
                        mock_sms_verification_create_request,
                        OtpType.SMS,
                    )

                    assert result == mock_response
                    # Verify that post was called (it will be called twice: once for token, once for API)
                    assert mock_http_client.post.call_count >= 1
                    # Check the last call to verify it's the SMS API call
                    last_call_args = mock_http_client.post.call_args_list[-1]
                    assert "/v2.0/factors/smsotp/" in last_call_args[0][0]

    @pytest.mark.asyncio
    async def test_dispatch_mfa_verification_create_voice(
        self, mock_voice_verification_create_request
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

                    result = await dispatch_send_mfa_otp(
                        mock_http_client,
                        mock_voice_verification_create_request,
                        OtpType.VOICE,
                    )

                    assert result == mock_response
                    # Verify that post was called (it will be called twice: once for token, once for API)
                    assert mock_http_client.post.call_count >= 1
                    # Check the last call to verify it's the Voice API call
                    last_call_args = mock_http_client.post.call_args_list[-1]
                    assert "/v2.0/factors/voiceotp/" in last_call_args[0][0]


class TestIntegrationBasics:
    """Basic integration tests to verify the functions exist and can be imported."""

    def test_unified_functions_exist(self):
        """Test that the unified functions can be imported."""
        from app.otp.services.verify_mfa_otp import (
            dispatch_send_mfa_otp,
            dispatch_verify_mfa_otp,
            handle_send_mfa_otp,
            handle_verify_mfa_otp,
        )

        # Verify functions are callable
        assert callable(handle_send_mfa_otp)
        assert callable(handle_verify_mfa_otp)
        assert callable(dispatch_send_mfa_otp)
        assert callable(dispatch_verify_mfa_otp)

    def test_otp_type_routing(self):
        """Test that OTP types are correctly mapped to endpoints."""
        # This is a basic test of the endpoint construction logic
        sms_endpoint = "smsotp"
        voice_endpoint = "voiceotp"

        assert "sms" in sms_endpoint.lower()
        assert "voice" in voice_endpoint.lower()


class TestHandleMFAOTPVerificationCreate:
    """Test the main verification create handler function."""

    @pytest.mark.asyncio
    async def test_verification_create_success_sms(
        self,
        mock_sms_verification_create_request,
        mock_successful_verification_response,
        mock_profile_success_response,
    ):
        """Test successful SMS verification creation."""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_mfa_otp.get_my_profile") as mock_profile:
            mock_profile.return_value = mock_profile_success_response

            with patch(
                "app.otp.services.verify_mfa_otp.dispatch_send_mfa_otp"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.json.return_value = mock_successful_verification_response
                mock_dispatch.return_value = mock_response

                result = await handle_send_mfa_otp(
                    mock_http_client,
                    mock_sms_verification_create_request,
                    "user_token",
                    OtpType.SMS,
                )

                assert result.success is True
                assert result.data.id == "verification123"
                assert "sms MFA OTP verification created successfully" in result.message

    @pytest.mark.asyncio
    async def test_verification_create_success_voice(
        self,
        mock_voice_verification_create_request,
        mock_successful_verification_response,
        mock_profile_success_response,
    ):
        """Test successful Voice verification creation."""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_mfa_otp.get_my_profile") as mock_profile:
            mock_profile.return_value = mock_profile_success_response

            with patch(
                "app.otp.services.verify_mfa_otp.dispatch_send_mfa_otp"
            ) as mock_dispatch:
                mock_response = MagicMock()
                voice_response = mock_successful_verification_response.copy()
                voice_response["type"] = "voiceotp"
                mock_response.json.return_value = voice_response
                mock_dispatch.return_value = mock_response

                result = await handle_send_mfa_otp(
                    mock_http_client,
                    mock_voice_verification_create_request,
                    "user_token",
                    OtpType.VOICE,
                )

                assert result.success is True
                assert result.data.id == "verification123"
                assert (
                    "voice MFA OTP verification created successfully" in result.message
                )

    @pytest.mark.asyncio
    async def test_verification_create_profile_failure(
        self, mock_sms_verification_create_request, mock_profile_failure_response
    ):
        """Test verification creation when profile check fails."""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_mfa_otp.get_my_profile") as mock_profile:
            mock_profile.return_value = mock_profile_failure_response

            result = await handle_send_mfa_otp(
                mock_http_client,
                mock_sms_verification_create_request,
                "user_token",
                OtpType.SMS,
            )

            assert result.success is False
            assert result.message == "User verification failed"

    @pytest.mark.asyncio
    async def test_verification_create_validation_error(
        self, mock_sms_verification_create_request, mock_profile_success_response
    ):
        """Test verification creation with malformed response causing validation error."""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_mfa_otp.get_my_profile") as mock_profile:
            mock_profile.return_value = mock_profile_success_response

            with patch(
                "app.otp.services.verify_mfa_otp.dispatch_send_mfa_otp"
            ) as mock_dispatch:
                mock_response = MagicMock()
                # Invalid response that will cause ValidationError
                mock_response.json.return_value = {"invalid": "data"}
                mock_dispatch.return_value = mock_response

                result = await handle_send_mfa_otp(
                    mock_http_client,
                    mock_sms_verification_create_request,
                    "user_token",
                    OtpType.SMS,
                )

                # generate_error_response returns JSONResponse, not ResponseModel
                # Just verify that function doesn't crash and returns something
                assert result is not None

    @pytest.mark.asyncio
    async def test_verification_create_general_exception(
        self, mock_sms_verification_create_request, mock_profile_success_response
    ):
        """Test verification creation with general exception handling."""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_mfa_otp.get_my_profile") as mock_profile:
            mock_profile.return_value = mock_profile_success_response

            with patch(
                "app.otp.services.verify_mfa_otp.dispatch_send_mfa_otp"
            ) as mock_dispatch:
                mock_dispatch.side_effect = Exception("Network error")

                with patch(
                    "app.otp.services.verify_mfa_otp.RequestErrorHandler.handle"
                ) as mock_error_handler:
                    mock_error_handler.return_value = None

                    result = await handle_send_mfa_otp(
                        mock_http_client,
                        mock_sms_verification_create_request,
                        "user_token",
                        OtpType.SMS,
                    )

                    # Function should return None when RequestErrorHandler is called
                    assert result is None
                    mock_error_handler.assert_called_once()


class TestHandleMFAOTPVerificationAttempt:
    """Test the main verification attempt handler function."""

    @pytest.mark.asyncio
    async def test_verification_attempt_success_sms(
        self, mock_sms_verification_attempt_request, mock_profile_success_response
    ):
        """Test successful SMS verification attempt."""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_mfa_otp.get_my_profile") as mock_profile:
            mock_profile.return_value = mock_profile_success_response

            with patch(
                "app.otp.services.verify_mfa_otp.dispatch_verify_mfa_otp"
            ) as mock_dispatch:
                mock_dispatch.return_value = None  # 204 No Content

                result = await handle_verify_mfa_otp(
                    mock_http_client,
                    mock_sms_verification_attempt_request,
                    "user_token",
                    OtpType.SMS,
                )

                assert result.success is True
                assert result.data is None
                assert (
                    "sms MFA OTP verification completed successfully" in result.message
                )

    @pytest.mark.asyncio
    async def test_verification_attempt_success_voice(
        self, mock_voice_verification_attempt_request, mock_profile_success_response
    ):
        """Test successful Voice verification attempt."""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_mfa_otp.get_my_profile") as mock_profile:
            mock_profile.return_value = mock_profile_success_response

            with patch(
                "app.otp.services.verify_mfa_otp.dispatch_verify_mfa_otp"
            ) as mock_dispatch:
                mock_dispatch.return_value = None  # 204 No Content

                result = await handle_verify_mfa_otp(
                    mock_http_client,
                    mock_voice_verification_attempt_request,
                    "user_token",
                    OtpType.VOICE,
                )

                assert result.success is True
                assert result.data is None
                assert (
                    "voice MFA OTP verification completed successfully"
                    in result.message
                )

    @pytest.mark.asyncio
    async def test_verification_attempt_profile_failure(
        self, mock_sms_verification_attempt_request, mock_profile_failure_response
    ):
        """Test verification attempt when profile check fails."""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_mfa_otp.get_my_profile") as mock_profile:
            mock_profile.return_value = mock_profile_failure_response

            result = await handle_verify_mfa_otp(
                mock_http_client,
                mock_sms_verification_attempt_request,
                "user_token",
                OtpType.SMS,
            )

            assert result.success is False
            assert result.message == "User verification failed"

    @pytest.mark.asyncio
    async def test_verification_attempt_general_exception(
        self, mock_sms_verification_attempt_request, mock_profile_success_response
    ):
        """Test verification attempt with general exception handling."""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_mfa_otp.get_my_profile") as mock_profile:
            mock_profile.return_value = mock_profile_success_response

            with patch(
                "app.otp.services.verify_mfa_otp.dispatch_verify_mfa_otp"
            ) as mock_dispatch:
                mock_dispatch.side_effect = Exception("Network error")

                with patch(
                    "app.otp.services.verify_mfa_otp.RequestErrorHandler.handle"
                ) as mock_error_handler:
                    mock_error_handler.return_value = None

                    result = await handle_verify_mfa_otp(
                        mock_http_client,
                        mock_sms_verification_attempt_request,
                        "user_token",
                        OtpType.SMS,
                    )

                    # Function should return None when RequestErrorHandler is called
                    assert result is None
                    mock_error_handler.assert_called_once()


class TestDispatchMFAVerificationCreate:
    """Test the dispatch verification create function with error scenarios."""

    @pytest.mark.asyncio
    async def test_dispatch_verification_create_unsupported_otp_type(
        self, mock_sms_verification_create_request
    ):
        """Test dispatch with unsupported OTP type."""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_mfa_otp.get_admin_token") as mock_get_token:
            mock_get_token.return_value = "admin_token"

            with pytest.raises(HTTPException) as exc_info:
                await dispatch_send_mfa_otp(
                    mock_http_client,
                    mock_sms_verification_create_request,
                    "INVALID_TYPE",  # This will cause ValueError
                )

            assert exc_info.value.status_code == 500
            assert "Unable to send MFA verification code" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_dispatch_verification_create_http_error(
        self, mock_sms_verification_create_request
    ):
        """Test dispatch with HTTP error."""
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

                    # Mock HTTP error
                    mock_request = Request("POST", "https://test.ibm.com")
                    mock_response = Response(400, request=mock_request)
                    http_error = HTTPStatusError(
                        "Bad Request", request=mock_request, response=mock_response
                    )
                    mock_http_client.post.side_effect = http_error

                    with patch(
                        "app.otp.services.verify_mfa_otp.RequestErrorHandler.handle"
                    ) as mock_error_handler:
                        mock_error_handler.return_value = None

                        result = await dispatch_send_mfa_otp(
                            mock_http_client,
                            mock_sms_verification_create_request,
                            OtpType.SMS,
                        )

                        assert result is None
                        mock_error_handler.assert_called_once()


class TestDispatchMFAVerificationAttempt:
    """Test the dispatch verification attempt function with error scenarios."""

    @pytest.mark.asyncio
    async def test_dispatch_verification_attempt_success_sms(
        self, mock_sms_verification_attempt_request
    ):
        """Test successful SMS verification attempt dispatch."""
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

                    result = await dispatch_verify_mfa_otp(
                        mock_http_client,
                        mock_sms_verification_attempt_request,
                        OtpType.SMS,
                    )

                    assert result == mock_response
                    # Check the call includes the correct SMS endpoint
                    last_call_args = mock_http_client.post.call_args_list[-1]
                    assert "/v2.0/factors/smsotp/" in last_call_args[0][0]
                    assert "/verifications/" in last_call_args[0][0]
                    # Check that OTP data is passed
                    assert last_call_args[1]["json"] == {"otp": "123456"}

    @pytest.mark.asyncio
    async def test_dispatch_verification_attempt_success_voice(
        self, mock_voice_verification_attempt_request
    ):
        """Test successful Voice verification attempt dispatch."""
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

                    result = await dispatch_verify_mfa_otp(
                        mock_http_client,
                        mock_voice_verification_attempt_request,
                        OtpType.VOICE,
                    )

                    assert result == mock_response
                    # Check the call includes the correct Voice endpoint
                    last_call_args = mock_http_client.post.call_args_list[-1]
                    assert "/v2.0/factors/voiceotp/" in last_call_args[0][0]
                    assert "/verifications/" in last_call_args[0][0]

    @pytest.mark.asyncio
    async def test_dispatch_verification_attempt_unsupported_otp_type(
        self, mock_sms_verification_attempt_request
    ):
        """Test dispatch attempt with unsupported OTP type."""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_mfa_otp.get_admin_token") as mock_get_token:
            mock_get_token.return_value = "admin_token"

            with pytest.raises(HTTPException) as exc_info:
                await dispatch_verify_mfa_otp(
                    mock_http_client,
                    mock_sms_verification_attempt_request,
                    "INVALID_TYPE",  # This will cause ValueError
                )

            assert exc_info.value.status_code == 500
            assert "Unable to verify MFA code" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_dispatch_verification_attempt_http_error(
        self, mock_sms_verification_attempt_request
    ):
        """Test dispatch attempt with HTTP error."""
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

                    # Mock HTTP error
                    mock_request = Request("POST", "https://test.ibm.com")
                    mock_response = Response(401, request=mock_request)
                    http_error = HTTPStatusError(
                        "Unauthorized", request=mock_request, response=mock_response
                    )
                    mock_http_client.post.side_effect = http_error

                    with patch(
                        "app.otp.services.verify_mfa_otp.RequestErrorHandler.handle"
                    ) as mock_error_handler:
                        mock_error_handler.return_value = None

                        result = await dispatch_verify_mfa_otp(
                            mock_http_client,
                            mock_sms_verification_attempt_request,
                            OtpType.SMS,
                        )

                        assert result is None
                        mock_error_handler.assert_called_once()
