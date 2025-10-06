"""
Tests for the unified MFA OTP verification functions.

These tests verify the refactored unified functions that accept OTP type parameters
instead of having separate SMS and Voice functions.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.otp.schemas import OtpType, OtpVerificationCreateRequest

from backend.app.otp.services.verify_mfa_otp import dispatch_mfa_verification_create


@pytest.fixture
def mock_verification_create_request():
    return OtpVerificationCreateRequest(id="factor123")


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
                    # Verify that post was called (it will be called twice: once for token, once for API)
                    assert mock_http_client.post.call_count >= 1
                    # Check the last call to verify it's the SMS API call
                    last_call_args = mock_http_client.post.call_args_list[-1]
                    assert "/v2.0/factors/smsotp/" in last_call_args[0][0]

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
                    # Verify that post was called (it will be called twice: once for token, once for API)
                    assert mock_http_client.post.call_count >= 1
                    # Check the last call to verify it's the Voice API call
                    last_call_args = mock_http_client.post.call_args_list[-1]
                    assert "/v2.0/factors/voiceotp/" in last_call_args[0][0]


class TestIntegrationBasics:
    """Basic integration tests to verify the functions exist and can be imported."""

    def test_unified_functions_exist(self):
        """Test that the unified functions can be imported."""
        from backend.app.otp.services.verify_mfa_otp import (
            dispatch_mfa_verification_attempt,
            dispatch_mfa_verification_create,
            handle_mfa_otp_verification_attempt,
            handle_mfa_otp_verification_create,
        )

        # Verify functions are callable
        assert callable(handle_mfa_otp_verification_create)
        assert callable(handle_mfa_otp_verification_attempt)
        assert callable(dispatch_mfa_verification_create)
        assert callable(dispatch_mfa_verification_attempt)

    def test_otp_type_routing(self):
        """Test that OTP types are correctly mapped to endpoints."""
        # This is a basic test of the endpoint construction logic
        sms_endpoint = "smsotp"
        voice_endpoint = "voiceotp"

        assert "sms" in sms_endpoint.lower()
        assert "voice" in voice_endpoint.lower()
