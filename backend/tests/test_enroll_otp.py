from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.otp.schemas import OtpEnrollmentRequest, OtpType
from app.otp.services.enroll_mfa_otp import (
    dispatch_otp_enrollment,
    handle_otp_enrollment,
)
from app.users.schemas import IBMVerifyUserProfileSchema, ProfileResponse


@pytest.fixture
def mock_sms_enrollment_request():
    return OtpEnrollmentRequest(phoneNumber="+19025555555", otpType=OtpType.SMS)


@pytest.fixture
def mock_voice_enrollment_request():
    return OtpEnrollmentRequest(phoneNumber="+19025555555", otpType=OtpType.VOICE)


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
        success=True, data=user_profile, message="Profile retrieved successfully"
    )


@pytest.fixture
def mock_ibm_enrollment_response():
    return {
        "id": "factor123",
        "userId": "user123",
        "type": "smsotp",
        "created": "2023-10-03T10:00:00Z",
        "updated": "2023-10-03T10:00:00Z",
        "enabled": True,
        "validated": False,
    }


class TestSMSEnrollment:
    @pytest.mark.asyncio
    async def test_handle_sms_otp_enrollment_success(
        self,
        mock_sms_enrollment_request,
        mock_user_profile_response,
        mock_ibm_enrollment_response,
    ):
        # Mock dependencies
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        # Mock the profile service
        with patch("app.otp.services.enroll_mfa_otp.get_my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            # Mock the dispatch function
            with patch(
                "app.otp.services.enroll_mfa_otp.dispatch_otp_enrollment"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = 201
                mock_response.json.return_value = mock_ibm_enrollment_response
                mock_dispatch.return_value = mock_response

                result = await handle_otp_enrollment(
                    mock_http_client,
                    mock_sms_enrollment_request,
                    mock_user_access_token,
                )

                assert result.success is True
                assert result.data.id == "factor123"
                assert result.data.type == "smsotp"
                assert result.message == "sms OTP factor enrolled successfully"

    @pytest.mark.asyncio
    async def test_handle_sms_otp_enrollment_profile_failure(
        self, mock_sms_enrollment_request
    ):
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        # Mock profile failure
        failed_profile_response = ProfileResponse(
            success=False, data=None, message="Profile retrieval failed"
        )

        with patch("app.otp.services.enroll_mfa_otp.get_my_profile") as mock_my_profile:
            mock_my_profile.return_value = failed_profile_response

            result = await handle_otp_enrollment(
                mock_http_client, mock_sms_enrollment_request, mock_user_access_token
            )

            assert result.success is False
            assert "User verification failed" in result.message

    @pytest.mark.asyncio
    async def test_handle_sms_otp_enrollment_ibm_error(
        self, mock_sms_enrollment_request, mock_user_profile_response
    ):
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.enroll_mfa_otp.get_my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.enroll_mfa_otp.dispatch_otp_enrollment"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = 400
                mock_response.json.return_value = {"error": "Invalid phone number"}
                mock_dispatch.return_value = mock_response

                result = await handle_otp_enrollment(
                    mock_http_client,
                    mock_sms_enrollment_request,
                    mock_user_access_token,
                )

                assert result.success is False
                assert "Invalid phone number" in result.message


class TestVoiceEnrollment:
    @pytest.mark.asyncio
    async def test_handle_voice_otp_enrollment_success(
        self, mock_voice_enrollment_request, mock_user_profile_response
    ):
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        mock_ibm_response = {
            "id": "factor456",
            "userId": "user123",
            "type": "voiceotp",
            "created": "2023-10-03T10:00:00Z",
            "updated": "2023-10-03T10:00:00Z",
            "enabled": True,
            "validated": False,
        }

        with patch("app.otp.services.enroll_mfa_otp.get_my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.enroll_mfa_otp.dispatch_otp_enrollment"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = 201
                mock_response.json.return_value = mock_ibm_response
                mock_dispatch.return_value = mock_response

                result = await handle_otp_enrollment(
                    mock_http_client,
                    mock_voice_enrollment_request,
                    mock_user_access_token,
                )

                assert result.success is True
                assert result.data.id == "factor456"
                assert result.data.type == "voiceotp"
                assert result.message == "voice OTP factor enrolled successfully"

    @pytest.mark.asyncio
    async def test_handle_voice_otp_enrollment_profile_failure(
        self, mock_voice_enrollment_request
    ):
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        # Mock profile failure
        failed_profile_response = ProfileResponse(
            success=False, data=None, message="Profile retrieval failed"
        )

        with patch("app.otp.services.enroll_mfa_otp.get_my_profile") as mock_my_profile:
            mock_my_profile.return_value = failed_profile_response

            result = await handle_otp_enrollment(
                mock_http_client, mock_voice_enrollment_request, mock_user_access_token
            )

            assert result.success is False
            assert "User verification failed" in result.message

    @pytest.mark.asyncio
    async def test_handle_voice_otp_enrollment_ibm_error(
        self, mock_voice_enrollment_request, mock_user_profile_response
    ):
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.enroll_mfa_otp.get_my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.enroll_mfa_otp.dispatch_otp_enrollment"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = 400
                mock_response.json.return_value = {"error": "Invalid phone number"}
                mock_dispatch.return_value = mock_response

                result = await handle_otp_enrollment(
                    mock_http_client,
                    mock_voice_enrollment_request,
                    mock_user_access_token,
                )

                assert result.success is False
                assert "Invalid phone number" in result.message


class TestDispatchFunctions:
    @pytest.mark.asyncio
    async def test_dispatch_sms_otp_enrollment(self, mock_sms_enrollment_request):
        mock_http_client = AsyncMock()
        user_id = "user123"

        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_http_client.post.return_value = mock_response

        with patch("app.otp.services.enroll_mfa_otp.get_admin_token") as mock_get_token:
            mock_get_token.return_value = "admin_token_123"

            with patch(
                "app.otp.services.enroll_mfa_otp.get_auth_request_headers"
            ) as mock_headers:
                mock_headers.return_value = {"Authorization": "Bearer admin_token_123"}

                with patch(
                    "app.otp.services.enroll_mfa_otp.get_configuration"
                ) as mock_config:
                    mock_config.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
                        "https://test.verify.ibm.com"
                    )

                    with patch(
                        "app.otp.services.enroll_mfa_otp.prepare_pydantic_phone_number_for_verify"
                    ) as mock_format:
                        mock_format.return_value = "+19025555555"

                        result = await dispatch_otp_enrollment(
                            mock_http_client, mock_sms_enrollment_request, user_id
                        )

                        assert result == mock_response
                        mock_http_client.post.assert_called_once()
                        call_args = mock_http_client.post.call_args
                        assert "smsotp" in call_args[0][0]
                        assert call_args[1]["json"]["userId"] == user_id
                        assert call_args[1]["json"]["phoneNumber"] == "+19025555555"
                        assert call_args[1]["json"]["enabled"] is True

    @pytest.mark.asyncio
    async def test_dispatch_voice_otp_enrollment(self, mock_voice_enrollment_request):
        mock_http_client = AsyncMock()
        user_id = "user123"

        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_http_client.post.return_value = mock_response

        with patch("app.otp.services.enroll_mfa_otp.get_admin_token") as mock_get_token:
            mock_get_token.return_value = "admin_token_123"

            with patch(
                "app.otp.services.enroll_mfa_otp.get_auth_request_headers"
            ) as mock_headers:
                mock_headers.return_value = {"Authorization": "Bearer admin_token_123"}

                with patch(
                    "app.otp.services.enroll_mfa_otp.get_configuration"
                ) as mock_config:
                    mock_config.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
                        "https://test.verify.ibm.com"
                    )

                    with patch(
                        "app.otp.services.enroll_mfa_otp.prepare_pydantic_phone_number_for_verify"
                    ) as mock_format:
                        mock_format.return_value = "+19025555555"

                        result = await dispatch_otp_enrollment(
                            mock_http_client, mock_voice_enrollment_request, user_id
                        )

                        assert result == mock_response
                        mock_http_client.post.assert_called_once()
                        call_args = mock_http_client.post.call_args
                        assert "voiceotp" in call_args[0][0]
                        assert call_args[1]["json"]["userId"] == user_id
                        assert call_args[1]["json"]["phoneNumber"] == "+19025555555"
                        assert call_args[1]["json"]["enabled"] is True
