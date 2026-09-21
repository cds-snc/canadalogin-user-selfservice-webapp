from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.otp.schemas import OtpEnrollmentRequest, OtpType
from app.otp.services.enroll_mfa_otp import (
    dispatch_otp_factor_validation,
    dispatch_otp_enrollment,
    handle_otp_enrollment,
)
from app.users.schemas import IBMVerifyUserProfileSchema, ProfileResponse
from fastapi import HTTPException


@pytest.fixture
def mock_sms_enrollment_request():
    return OtpEnrollmentRequest(destination="+19025555555", otpType=OtpType.SMS)


@pytest.fixture
def mock_voice_enrollment_request():
    return OtpEnrollmentRequest(destination="+19025555555", otpType=OtpType.VOICE)


@pytest.fixture
def mock_email_enrollment_request():
    return OtpEnrollmentRequest(
        destination="newemail@example.com", otpType=OtpType.EMAIL
    )


@pytest.fixture
def mock_user_profile_response():
    from datetime import datetime

    from app.users.schemas import Meta, UserProfileName

    user_profile = IBMVerifyUserProfileSchema(
        id="user123",
        userName="test@example.com",
        name=UserProfileName(givenName="Test", familyName="User"),
        contactNumber=None,
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


class TestEmailEnrollment:
    @pytest.mark.asyncio
    async def test_handle_email_otp_enrollment_success(
        self, mock_email_enrollment_request, mock_user_profile_response
    ):
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        mock_ibm_response = {
            "id": "factor789",
            "userId": "user123",
            "type": "emailotp",
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
                    mock_email_enrollment_request,
                    mock_user_access_token,
                )

                assert result.success is True
                assert result.data.id == "factor789"
                assert result.data.type == "emailotp"
                assert result.message == "email OTP factor enrolled successfully"


class TestDispatchFunctions:
    @pytest.mark.asyncio
    async def test_dispatch_sms_otp_enrollment(self, mock_sms_enrollment_request):
        mock_http_client = AsyncMock()
        user_id = "user123"
        user_access_token = "user_token_123"

        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_http_client.post.return_value = mock_response

        with patch(
            "app.otp.services.enroll_mfa_otp.get_auth_request_headers"
        ) as mock_headers:
            mock_headers.return_value = {"Authorization": "Bearer user_token_123"}

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
                        mock_http_client,
                        mock_sms_enrollment_request,
                        user_id,
                        user_access_token,
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
        user_access_token = "user_token_123"

        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_http_client.post.return_value = mock_response

        with patch(
            "app.otp.services.enroll_mfa_otp.get_auth_request_headers"
        ) as mock_headers:
            mock_headers.return_value = {"Authorization": "Bearer user_token_123"}

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
                        mock_http_client,
                        mock_voice_enrollment_request,
                        user_id,
                        user_access_token,
                    )

                    assert result == mock_response
                    mock_http_client.post.assert_called_once()
                    call_args = mock_http_client.post.call_args
                    assert "voiceotp" in call_args[0][0]
                    assert call_args[1]["json"]["userId"] == user_id
                    assert call_args[1]["json"]["phoneNumber"] == "+19025555555"
                    assert call_args[1]["json"]["enabled"] is True

    @pytest.mark.asyncio
    async def test_dispatch_enrollment_raises_http_exception_on_409(
        self, mock_sms_enrollment_request
    ):
        mock_http_client = AsyncMock()
        user_id = "user123"
        user_access_token = "user_token_123"

        mock_response = MagicMock()
        mock_response.status_code = 409
        mock_http_client.post.return_value = mock_response

        with patch(
            "app.otp.services.enroll_mfa_otp.get_auth_request_headers"
        ) as mock_headers:
            mock_headers.return_value = {"Authorization": "Bearer user_token_123"}

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

                    with pytest.raises(HTTPException) as exc_info:
                        await dispatch_otp_enrollment(
                            mock_http_client,
                            mock_sms_enrollment_request,
                            user_id,
                            user_access_token,
                        )

                    assert exc_info.value.status_code == 409
                    assert exc_info.value.detail == "mfa_phone_duplicate"

    @pytest.mark.asyncio
    async def test_dispatch_enrollment_adds_plus_prefix_for_phone_number(
        self, mock_sms_enrollment_request
    ):
        mock_http_client = AsyncMock()
        user_id = "user123"
        user_access_token = "user_token_123"

        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_http_client.post.return_value = mock_response

        with patch(
            "app.otp.services.enroll_mfa_otp.get_auth_request_headers"
        ) as mock_headers:
            mock_headers.return_value = {"Authorization": "Bearer user_token_123"}

            with patch(
                "app.otp.services.enroll_mfa_otp.get_configuration"
            ) as mock_config:
                mock_config.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
                    "https://test.verify.ibm.com"
                )

                with patch(
                    "app.otp.services.enroll_mfa_otp.prepare_pydantic_phone_number_for_verify"
                ) as mock_format:
                    # Simulate current formatter behavior (digits-only)
                    mock_format.return_value = "19025555555"

                    await dispatch_otp_enrollment(
                        mock_http_client,
                        mock_sms_enrollment_request,
                        user_id,
                        user_access_token,
                    )

                    call_args = mock_http_client.post.call_args
                    assert call_args[1]["json"]["phoneNumber"] == "+19025555555"

    @pytest.mark.asyncio
    async def test_dispatch_email_otp_enrollment(self, mock_email_enrollment_request):
        mock_http_client = AsyncMock()
        user_id = "user123"
        user_access_token = "user_token_123"

        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_http_client.post.return_value = mock_response

        with patch(
            "app.otp.services.enroll_mfa_otp.get_auth_request_headers"
        ) as mock_headers:
            mock_headers.return_value = {"Authorization": "Bearer user_token_123"}

            with patch(
                "app.otp.services.enroll_mfa_otp.get_configuration"
            ) as mock_config:
                mock_config.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
                    "https://test.verify.ibm.com"
                )

                result = await dispatch_otp_enrollment(
                    mock_http_client,
                    mock_email_enrollment_request,
                    user_id,
                    user_access_token,
                )

                assert result == mock_response
                mock_http_client.post.assert_called_once()
                call_args = mock_http_client.post.call_args
                assert "emailotp" in call_args[0][0]
                assert call_args[1]["json"]["userId"] == user_id
                assert call_args[1]["json"]["emailAddress"] == "newemail@example.com"
                assert call_args[1]["json"]["enabled"] is True

    @pytest.mark.asyncio
    async def test_dispatch_email_otp_enrollment_adds_theme_query(
        self, mock_email_enrollment_request
    ):
        mock_http_client = AsyncMock()
        user_id = "user123"
        user_access_token = "user_token_123"

        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_http_client.post.return_value = mock_response

        with patch(
            "app.otp.services.enroll_mfa_otp.get_auth_request_headers"
        ) as mock_headers:
            mock_headers.return_value = {"Authorization": "Bearer user_token_123"}

            with patch(
                "app.otp.services.enroll_mfa_otp.get_configuration"
            ) as mock_config:
                mock_config.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
                    "https://test.verify.ibm.com"
                )

                await dispatch_otp_enrollment(
                    mock_http_client,
                    mock_email_enrollment_request,
                    user_id,
                    user_access_token,
                    theme_id="57eee205-04f6-463b-b9a6-32ae84aa8943",
                )

                call_args = mock_http_client.post.call_args
                assert call_args[0][0] == (
                    "https://test.verify.ibm.com/v2.0/factors/emailotp"
                    "?themeId=57eee205-04f6-463b-b9a6-32ae84aa8943"
                )

    @pytest.mark.asyncio
    async def test_dispatch_otp_factor_validation_puts_payload(self):
        mock_http_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_http_client.put.return_value = mock_response

        with patch(
            "app.otp.services.enroll_mfa_otp.get_auth_request_headers"
        ) as mock_headers:
            mock_headers.return_value = {"Authorization": "Bearer user_token_123"}

            with patch(
                "app.otp.services.enroll_mfa_otp.get_configuration"
            ) as mock_config:
                mock_config.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
                    "https://test.verify.ibm.com"
                )

                payload = {
                    "id": "factor789",
                    "userId": "user123",
                    "type": "emailotp",
                    "emailAddress": "newemail@example.com",
                    "enabled": True,
                    "validated": True,
                }

                result = await dispatch_otp_factor_validation(
                    global_http_client=mock_http_client,
                    factor_id="factor789",
                    otp_type=OtpType.EMAIL,
                    factor_payload=payload,
                    user_access_token="user_token_123",
                )

                assert result == mock_response
                mock_http_client.put.assert_called_once_with(
                    "https://test.verify.ibm.com/factors/v2.0/factors/emailotp/factor789",
                    json=payload,
                    headers={"Authorization": "Bearer user_token_123"},
                )
