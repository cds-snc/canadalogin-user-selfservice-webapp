from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.otp.schemas import OtpVerificationAttemptRequest, OtpVerificationCreateRequest
from app.otp.services.verify_otp import (
    dispatch_sms_verification_attempt,
    dispatch_sms_verification_create,
    dispatch_voice_verification_attempt,
    dispatch_voice_verification_create,
    handle_sms_otp_verification_attempt,
    handle_sms_otp_verification_create,
    handle_voice_otp_verification_attempt,
    handle_voice_otp_verification_create,
)
from app.users.schemas import IBMVerifyUserProfileSchema, ProfileResponse


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
        success=True, data=user_profile, message="Profile retrieved successfully"
    )


@pytest.fixture
def mock_ibm_verification_create_response():
    return {
        "id": "verification123",
        "userId": "user123",
        "type": "smsotp",
        "created": "2023-10-03T10:00:00Z",
        "updated": "2023-10-03T10:00:00Z",
        "expiry": "2023-10-03T10:05:00Z",
        "state": "PENDING",
        "updatedBy": "user123",
        "correlation": "4567",
        "phoneNumber": "+15345678911",
        "attempts": 0,
        "retries": 4,
    }


# Removed: mock_ibm_verification_attempt_response fixture no longer needed
# as IBM Verify API returns 204 No Content for attempt operations


class TestSMSVerificationCreate:
    @pytest.mark.asyncio
    async def test_handle_sms_otp_verification_create_success(
        self,
        mock_verification_create_request,
        mock_user_profile_response,
        mock_ibm_verification_create_response,
    ):
        # Mock dependencies
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        # Mock the profile service
        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            # Mock the dispatch function
            with patch(
                "app.otp.services.verify_otp.dispatch_sms_verification_create"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = 201
                mock_response.json.return_value = mock_ibm_verification_create_response
                mock_dispatch.return_value = mock_response

                result = await handle_sms_otp_verification_create(
                    mock_http_client,
                    mock_verification_create_request,
                    mock_user_access_token,
                )

                assert result.success is True
                assert result.data.id == "verification123"
                assert result.data.userId == "user123"
                assert result.data.state == "PENDING"
                assert result.message == "SMS OTP verification created successfully"

    @pytest.mark.asyncio
    async def test_handle_sms_otp_verification_create_profile_failure(
        self, mock_verification_create_request
    ):
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        # Mock profile failure
        failed_profile_response = ProfileResponse(
            success=False, data=None, message="Profile retrieval failed"
        )

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = failed_profile_response

            result = await handle_sms_otp_verification_create(
                mock_http_client,
                mock_verification_create_request,
                mock_user_access_token,
            )

            assert result.success is False
            assert "User verification failed" in result.message

    @pytest.mark.asyncio
    async def test_handle_sms_otp_verification_create_ibm_error(
        self, mock_verification_create_request, mock_user_profile_response
    ):
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_otp.dispatch_sms_verification_create"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = 400
                mock_response.json.return_value = {"error": "Invalid factor ID"}
                mock_dispatch.return_value = mock_response

                result = await handle_sms_otp_verification_create(
                    mock_http_client,
                    mock_verification_create_request,
                    mock_user_access_token,
                )

                assert result.success is False
                assert "Invalid factor ID" in result.message


class TestVoiceVerificationCreate:
    @pytest.mark.asyncio
    async def test_handle_voice_otp_verification_create_success(
        self,
        mock_verification_create_request,
        mock_user_profile_response,
        mock_ibm_verification_create_response,
    ):
        # Mock dependencies
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        # Mock the profile service
        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            # Mock the dispatch function
            with patch(
                "app.otp.services.verify_otp.dispatch_voice_verification_create"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = 201
                mock_response.json.return_value = mock_ibm_verification_create_response
                mock_dispatch.return_value = mock_response

                result = await handle_voice_otp_verification_create(
                    mock_http_client,
                    mock_verification_create_request,
                    mock_user_access_token,
                )

                assert result.success is True
                assert result.data.id == "verification123"
                assert result.data.userId == "user123"
                assert result.data.state == "PENDING"
                assert result.message == "Voice OTP verification created successfully"

    @pytest.mark.asyncio
    async def test_handle_voice_otp_verification_create_profile_failure(
        self, mock_verification_create_request
    ):
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        # Mock profile failure
        failed_profile_response = ProfileResponse(
            success=False, data=None, message="Profile retrieval failed"
        )

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = failed_profile_response

            result = await handle_voice_otp_verification_create(
                mock_http_client,
                mock_verification_create_request,
                mock_user_access_token,
            )

            assert result.success is False
            assert "User verification failed" in result.message

    @pytest.mark.asyncio
    async def test_handle_voice_otp_verification_create_ibm_error(
        self, mock_verification_create_request, mock_user_profile_response
    ):
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_otp.dispatch_voice_verification_create"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = 400
                mock_response.json.return_value = {"error": "Invalid factor ID"}
                mock_dispatch.return_value = mock_response

                result = await handle_voice_otp_verification_create(
                    mock_http_client,
                    mock_verification_create_request,
                    mock_user_access_token,
                )

                assert result.success is False
                assert "Invalid factor ID" in result.message


class TestSMSVerificationAttempt:
    @pytest.mark.asyncio
    async def test_handle_sms_otp_verification_attempt_success(
        self,
        mock_verification_attempt_request,
        mock_user_profile_response,
    ):
        # Mock dependencies
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        # Mock the profile service
        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            # Mock the dispatch function
            with patch(
                "app.otp.services.verify_otp.dispatch_sms_verification_attempt"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = 204  # IBM Verify returns 204 No Content
                mock_dispatch.return_value = mock_response

                result = await handle_sms_otp_verification_attempt(
                    mock_http_client,
                    mock_verification_attempt_request,
                    mock_user_access_token,
                )

                assert result.success is True
                assert result.data is None  # No response body for 204
                assert result.message == "SMS OTP verification completed successfully"

    @pytest.mark.asyncio
    async def test_handle_sms_otp_verification_attempt_profile_failure(
        self, mock_verification_attempt_request
    ):
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        # Mock profile failure
        failed_profile_response = ProfileResponse(
            success=False, data=None, message="Profile retrieval failed"
        )

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = failed_profile_response

            result = await handle_sms_otp_verification_attempt(
                mock_http_client,
                mock_verification_attempt_request,
                mock_user_access_token,
            )

            assert result.success is False
            assert "User verification failed" in result.message

    @pytest.mark.asyncio
    async def test_handle_sms_otp_verification_attempt_ibm_error(
        self, mock_verification_attempt_request, mock_user_profile_response
    ):
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_otp.dispatch_sms_verification_attempt"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = 400
                mock_response.json.return_value = {"error": "Invalid OTP"}
                mock_dispatch.return_value = mock_response

                result = await handle_sms_otp_verification_attempt(
                    mock_http_client,
                    mock_verification_attempt_request,
                    mock_user_access_token,
                )

                assert result.success is False
                assert "Invalid OTP" in result.message


class TestVoiceVerificationAttempt:
    @pytest.mark.asyncio
    async def test_handle_voice_otp_verification_attempt_success(
        self,
        mock_verification_attempt_request,
        mock_user_profile_response,
    ):
        # Mock dependencies
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        # Mock the profile service
        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            # Mock the dispatch function
            with patch(
                "app.otp.services.verify_otp.dispatch_voice_verification_attempt"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = 204  # IBM Verify returns 204 No Content
                mock_dispatch.return_value = mock_response

                result = await handle_voice_otp_verification_attempt(
                    mock_http_client,
                    mock_verification_attempt_request,
                    mock_user_access_token,
                )

                assert result.success is True
                assert result.data is None  # No response body for 204
                assert result.message == "Voice OTP verification completed successfully"

    @pytest.mark.asyncio
    async def test_handle_voice_otp_verification_attempt_profile_failure(
        self, mock_verification_attempt_request
    ):
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        # Mock profile failure
        failed_profile_response = ProfileResponse(
            success=False, data=None, message="Profile retrieval failed"
        )

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = failed_profile_response

            result = await handle_voice_otp_verification_attempt(
                mock_http_client,
                mock_verification_attempt_request,
                mock_user_access_token,
            )

            assert result.success is False
            assert "User verification failed" in result.message

    @pytest.mark.asyncio
    async def test_handle_voice_otp_verification_attempt_ibm_error(
        self, mock_verification_attempt_request, mock_user_profile_response
    ):
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_otp.dispatch_voice_verification_attempt"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = 400
                mock_response.json.return_value = {"error": "Invalid OTP"}
                mock_dispatch.return_value = mock_response

                result = await handle_voice_otp_verification_attempt(
                    mock_http_client,
                    mock_verification_attempt_request,
                    mock_user_access_token,
                )

                assert result.success is False
                assert "Invalid OTP" in result.message


class TestDispatchFunctions:
    @pytest.mark.asyncio
    async def test_dispatch_sms_verification_create(
        self, mock_verification_create_request
    ):
        mock_http_client = AsyncMock()

        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_http_client.post.return_value = mock_response

        with patch("app.otp.services.verify_otp.get_admin_token") as mock_get_token:
            mock_get_token.return_value = "admin_token_123"

            with patch(
                "app.otp.services.verify_otp.get_auth_request_headers"
            ) as mock_headers:
                mock_headers.return_value = {"Authorization": "Bearer admin_token_123"}

                with patch(
                    "app.otp.services.verify_otp.get_configuration"
                ) as mock_config:
                    mock_config.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
                        "https://test.verify.ibm.com"
                    )

                    result = await dispatch_sms_verification_create(
                        mock_http_client, mock_verification_create_request
                    )

                    assert result == mock_response
                    mock_http_client.post.assert_called_once()
                    call_args = mock_http_client.post.call_args
                    assert "smsotp/factor123/verifications" in call_args[0][0]
                    assert call_args[1]["json"] == {}

    @pytest.mark.asyncio
    async def test_dispatch_voice_verification_create(
        self, mock_verification_create_request
    ):
        mock_http_client = AsyncMock()

        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_http_client.post.return_value = mock_response

        with patch("app.otp.services.verify_otp.get_admin_token") as mock_get_token:
            mock_get_token.return_value = "admin_token_123"

            with patch(
                "app.otp.services.verify_otp.get_auth_request_headers"
            ) as mock_headers:
                mock_headers.return_value = {"Authorization": "Bearer admin_token_123"}

                with patch(
                    "app.otp.services.verify_otp.get_configuration"
                ) as mock_config:
                    mock_config.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
                        "https://test.verify.ibm.com"
                    )

                    result = await dispatch_voice_verification_create(
                        mock_http_client, mock_verification_create_request
                    )

                    assert result == mock_response
                    mock_http_client.post.assert_called_once()
                    call_args = mock_http_client.post.call_args
                    assert "voiceotp/factor123/verifications" in call_args[0][0]
                    assert call_args[1]["json"] == {}

    @pytest.mark.asyncio
    async def test_dispatch_sms_verification_attempt(
        self, mock_verification_attempt_request
    ):
        mock_http_client = AsyncMock()

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_http_client.post.return_value = mock_response

        with patch("app.otp.services.verify_otp.get_admin_token") as mock_get_token:
            mock_get_token.return_value = "admin_token_123"

            with patch(
                "app.otp.services.verify_otp.get_auth_request_headers"
            ) as mock_headers:
                mock_headers.return_value = {"Authorization": "Bearer admin_token_123"}

                with patch(
                    "app.otp.services.verify_otp.get_configuration"
                ) as mock_config:
                    mock_config.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
                        "https://test.verify.ibm.com"
                    )

                    result = await dispatch_sms_verification_attempt(
                        mock_http_client, mock_verification_attempt_request
                    )

                    assert result == mock_response
                    mock_http_client.post.assert_called_once()
                    call_args = mock_http_client.post.call_args
                    assert (
                        "smsotp/factor123/verifications/verification123"
                        in call_args[0][0]
                    )
                    assert call_args[1]["json"]["otp"] == "123456"

    @pytest.mark.asyncio
    async def test_dispatch_voice_verification_attempt(
        self, mock_verification_attempt_request
    ):
        mock_http_client = AsyncMock()

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_http_client.post.return_value = mock_response

        with patch("app.otp.services.verify_otp.get_admin_token") as mock_get_token:
            mock_get_token.return_value = "admin_token_123"

            with patch(
                "app.otp.services.verify_otp.get_auth_request_headers"
            ) as mock_headers:
                mock_headers.return_value = {"Authorization": "Bearer admin_token_123"}

                with patch(
                    "app.otp.services.verify_otp.get_configuration"
                ) as mock_config:
                    mock_config.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
                        "https://test.verify.ibm.com"
                    )

                    result = await dispatch_voice_verification_attempt(
                        mock_http_client, mock_verification_attempt_request
                    )

                    assert result == mock_response
                    mock_http_client.post.assert_called_once()
                    call_args = mock_http_client.post.call_args
                    assert (
                        "voiceotp/factor123/verifications/verification123"
                        in call_args[0][0]
                    )
                    assert call_args[1]["json"]["otp"] == "123456"


class TestErrorHandling:
    """Test error handling scenarios to increase code coverage"""

    @pytest.mark.asyncio
    async def test_sms_verification_create_validation_error(
        self, mock_verification_create_request, mock_user_profile_response
    ):
        """Test ValidationError handling in SMS verification create"""
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_otp.dispatch_sms_verification_create"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = 201
                # Create malformed response that will cause ValidationError
                mock_response.json.return_value = {"invalid": "data"}
                mock_dispatch.return_value = mock_response

                result = await handle_sms_otp_verification_create(
                    mock_http_client,
                    mock_verification_create_request,
                    mock_user_access_token,
                )

                # ValidationError returns JSONResponse
                assert result.status_code == 422
                import json

                content = json.loads(result.body.decode())
                assert content["success"] is False
                assert content["message"] == "Server Error"

    @pytest.mark.asyncio
    async def test_sms_verification_create_general_exception(
        self, mock_verification_create_request, mock_user_profile_response
    ):
        """Test general Exception handling in SMS verification create"""
        from fastapi import HTTPException

        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_otp.dispatch_sms_verification_create"
            ) as mock_dispatch:
                # Simulate unexpected exception
                mock_dispatch.side_effect = Exception("Network error")

                with pytest.raises(HTTPException) as exc_info:
                    await handle_sms_otp_verification_create(
                        mock_http_client,
                        mock_verification_create_request,
                        mock_user_access_token,
                    )

                assert exc_info.value.status_code == 500
                assert "SMS OTP verification creation error" in str(
                    exc_info.value.detail
                )

    @pytest.mark.asyncio
    async def test_voice_verification_create_validation_error(
        self, mock_verification_create_request, mock_user_profile_response
    ):
        """Test ValidationError handling in Voice verification create"""
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_otp.dispatch_voice_verification_create"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = 201
                # Create malformed response that will cause ValidationError
                mock_response.json.return_value = {"invalid": "data"}
                mock_dispatch.return_value = mock_response

                result = await handle_voice_otp_verification_create(
                    mock_http_client,
                    mock_verification_create_request,
                    mock_user_access_token,
                )

                # ValidationError returns JSONResponse
                assert result.status_code == 422
                import json

                content = json.loads(result.body.decode())
                assert content["success"] is False
                assert content["message"] == "Server Error"

    @pytest.mark.asyncio
    async def test_voice_verification_create_general_exception(
        self, mock_verification_create_request, mock_user_profile_response
    ):
        """Test general Exception handling in Voice verification create"""
        from fastapi import HTTPException

        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_otp.dispatch_voice_verification_create"
            ) as mock_dispatch:
                # Simulate unexpected exception
                mock_dispatch.side_effect = Exception("Network error")

                with pytest.raises(HTTPException) as exc_info:
                    await handle_voice_otp_verification_create(
                        mock_http_client,
                        mock_verification_create_request,
                        mock_user_access_token,
                    )

                assert exc_info.value.status_code == 500
                assert "Voice OTP verification creation error" in str(
                    exc_info.value.detail
                )

    @pytest.mark.asyncio
    async def test_sms_verification_attempt_validation_error(
        self, mock_verification_attempt_request, mock_user_profile_response
    ):
        """Test ValidationError handling in SMS verification attempt"""
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_otp.dispatch_sms_verification_attempt"
            ) as mock_dispatch:
                mock_response = MagicMock()
                # Test non-204 status code (error case)
                mock_response.status_code = 400
                mock_response.json.return_value = {"error": "Invalid OTP"}
                mock_dispatch.return_value = mock_response

                result = await handle_sms_otp_verification_attempt(
                    mock_http_client,
                    mock_verification_attempt_request,
                    mock_user_access_token,
                )

                # Error response should return ResponseModel
                assert result.success is False
                assert result.data is None
                assert "Invalid OTP" in result.message

    @pytest.mark.asyncio
    async def test_sms_verification_attempt_general_exception(
        self, mock_verification_attempt_request, mock_user_profile_response
    ):
        """Test general Exception handling in SMS verification attempt"""
        from fastapi import HTTPException

        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_otp.dispatch_sms_verification_attempt"
            ) as mock_dispatch:
                # Simulate unexpected exception
                mock_dispatch.side_effect = Exception("Network error")

                with pytest.raises(HTTPException) as exc_info:
                    await handle_sms_otp_verification_attempt(
                        mock_http_client,
                        mock_verification_attempt_request,
                        mock_user_access_token,
                    )

                assert exc_info.value.status_code == 500
                assert "SMS OTP verification attempt error" in str(
                    exc_info.value.detail
                )

    @pytest.mark.asyncio
    async def test_voice_verification_attempt_validation_error(
        self, mock_verification_attempt_request, mock_user_profile_response
    ):
        """Test ValidationError handling in Voice verification attempt"""
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_otp.dispatch_voice_verification_attempt"
            ) as mock_dispatch:
                mock_response = MagicMock()
                # Test non-204 status code (error case)
                mock_response.status_code = 400
                mock_response.json.return_value = {"error": "Invalid OTP"}
                mock_dispatch.return_value = mock_response

                result = await handle_voice_otp_verification_attempt(
                    mock_http_client,
                    mock_verification_attempt_request,
                    mock_user_access_token,
                )

                # Error response should return ResponseModel
                assert result.success is False
                assert result.data is None
                assert "Invalid OTP" in result.message

    @pytest.mark.asyncio
    async def test_voice_verification_attempt_general_exception(
        self, mock_verification_attempt_request, mock_user_profile_response
    ):
        """Test general Exception handling in Voice verification attempt"""
        from fastapi import HTTPException

        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_otp.dispatch_voice_verification_attempt"
            ) as mock_dispatch:
                # Simulate unexpected exception
                mock_dispatch.side_effect = Exception("Network error")

                with pytest.raises(HTTPException) as exc_info:
                    await handle_voice_otp_verification_attempt(
                        mock_http_client,
                        mock_verification_attempt_request,
                        mock_user_access_token,
                    )

                assert exc_info.value.status_code == 500
                assert "Voice OTP verification attempt error" in str(
                    exc_info.value.detail
                )

    @pytest.mark.asyncio
    async def test_dispatch_sms_verification_create_http_exception(
        self, mock_verification_create_request
    ):
        """Test HTTPException handling in dispatch SMS verification create"""
        from fastapi import HTTPException

        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_otp.get_admin_token") as mock_get_token:
            mock_get_token.side_effect = HTTPException(
                status_code=401, detail="Unauthorized"
            )

            with pytest.raises(HTTPException) as exc_info:
                await dispatch_sms_verification_create(
                    mock_http_client, mock_verification_create_request
                )

            assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_dispatch_sms_verification_create_general_exception(
        self, mock_verification_create_request
    ):
        """Test general Exception handling in dispatch SMS verification create"""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_otp.get_admin_token") as mock_get_token:
            mock_get_token.side_effect = Exception("Token service error")

            with pytest.raises(Exception) as exc_info:
                await dispatch_sms_verification_create(
                    mock_http_client, mock_verification_create_request
                )

            assert "Token service error" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_dispatch_voice_verification_create_http_exception(
        self, mock_verification_create_request
    ):
        """Test HTTPException handling in dispatch Voice verification create"""
        from fastapi import HTTPException

        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_otp.get_admin_token") as mock_get_token:
            mock_get_token.side_effect = HTTPException(
                status_code=401, detail="Unauthorized"
            )

            with pytest.raises(HTTPException) as exc_info:
                await dispatch_voice_verification_create(
                    mock_http_client, mock_verification_create_request
                )

            assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_dispatch_voice_verification_create_general_exception(
        self, mock_verification_create_request
    ):
        """Test general Exception handling in dispatch Voice verification create"""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_otp.get_admin_token") as mock_get_token:
            mock_get_token.side_effect = Exception("Token service error")

            with pytest.raises(Exception) as exc_info:
                await dispatch_voice_verification_create(
                    mock_http_client, mock_verification_create_request
                )

            assert "Token service error" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_dispatch_sms_verification_attempt_http_exception(
        self, mock_verification_attempt_request
    ):
        """Test HTTPException handling in dispatch SMS verification attempt"""
        from fastapi import HTTPException

        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_otp.get_admin_token") as mock_get_token:
            mock_get_token.side_effect = HTTPException(
                status_code=401, detail="Unauthorized"
            )

            with pytest.raises(HTTPException) as exc_info:
                await dispatch_sms_verification_attempt(
                    mock_http_client, mock_verification_attempt_request
                )

            assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_dispatch_sms_verification_attempt_general_exception(
        self, mock_verification_attempt_request
    ):
        """Test general Exception handling in dispatch SMS verification attempt"""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_otp.get_admin_token") as mock_get_token:
            mock_get_token.side_effect = Exception("Token service error")

            with pytest.raises(Exception) as exc_info:
                await dispatch_sms_verification_attempt(
                    mock_http_client, mock_verification_attempt_request
                )

            assert "Token service error" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_dispatch_voice_verification_attempt_http_exception(
        self, mock_verification_attempt_request
    ):
        """Test HTTPException handling in dispatch Voice verification attempt"""
        from fastapi import HTTPException

        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_otp.get_admin_token") as mock_get_token:
            mock_get_token.side_effect = HTTPException(
                status_code=401, detail="Unauthorized"
            )

            with pytest.raises(HTTPException) as exc_info:
                await dispatch_voice_verification_attempt(
                    mock_http_client, mock_verification_attempt_request
                )

            assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_dispatch_voice_verification_attempt_general_exception(
        self, mock_verification_attempt_request
    ):
        """Test general Exception handling in dispatch Voice verification attempt"""
        mock_http_client = AsyncMock()

        with patch("app.otp.services.verify_otp.get_admin_token") as mock_get_token:
            mock_get_token.side_effect = Exception("Token service error")

            with pytest.raises(Exception) as exc_info:
                await dispatch_voice_verification_attempt(
                    mock_http_client, mock_verification_attempt_request
                )

            assert "Token service error" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_verification_create_status_code_none(
        self, mock_verification_create_request, mock_user_profile_response
    ):
        """Test handling when HTTP response status_code is None"""
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_otp.dispatch_sms_verification_create"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = None  # Simulate None status code
                mock_dispatch.return_value = mock_response

                result = await handle_sms_otp_verification_create(
                    mock_http_client,
                    mock_verification_create_request,
                    mock_user_access_token,
                )

                # Status code None returns JSONResponse
                assert result.status_code == 400
                import json

                content = json.loads(result.body.decode())
                assert content["success"] is False
                assert content["message"] == "Unknown error"

    @pytest.mark.asyncio
    async def test_verification_attempt_status_code_none(
        self, mock_verification_attempt_request, mock_user_profile_response
    ):
        """Test handling when HTTP response status_code is None in attempt"""
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_otp.dispatch_sms_verification_attempt"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = None  # Simulate None status code
                mock_dispatch.return_value = mock_response

                result = await handle_sms_otp_verification_attempt(
                    mock_http_client,
                    mock_verification_attempt_request,
                    mock_user_access_token,
                )

                # Status code None returns JSONResponse
                assert result.status_code == 400
                import json

                content = json.loads(result.body.decode())
                assert content["success"] is False
                assert content["message"] == "Unknown error"

    @pytest.mark.asyncio
    async def test_voice_verification_create_status_code_none(
        self, mock_verification_create_request, mock_user_profile_response
    ):
        """Test handling when HTTP response status_code is None for Voice OTP create"""
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_otp.dispatch_voice_verification_create"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = None  # Simulate None status code
                mock_dispatch.return_value = mock_response

                result = await handle_voice_otp_verification_create(
                    mock_http_client,
                    mock_verification_create_request,
                    mock_user_access_token,
                )

                # Status code None returns JSONResponse
                assert result.status_code == 400
                import json

                content = json.loads(result.body.decode())
                assert content["success"] is False
                assert content["message"] == "Unknown error"

    @pytest.mark.asyncio
    async def test_voice_verification_attempt_status_code_none(
        self, mock_verification_attempt_request, mock_user_profile_response
    ):
        """Test handling when HTTP response status_code is None for Voice OTP attempt"""
        mock_http_client = AsyncMock()
        mock_user_access_token = "user_token_123"

        with patch("app.otp.services.verify_otp.my_profile") as mock_my_profile:
            mock_my_profile.return_value = mock_user_profile_response

            with patch(
                "app.otp.services.verify_otp.dispatch_voice_verification_attempt"
            ) as mock_dispatch:
                mock_response = MagicMock()
                mock_response.status_code = None  # Simulate None status code
                mock_dispatch.return_value = mock_response

                result = await handle_voice_otp_verification_attempt(
                    mock_http_client,
                    mock_verification_attempt_request,
                    mock_user_access_token,
                )

                # Status code None returns JSONResponse
                assert result.status_code == 400
                import json

                content = json.loads(result.body.decode())
                assert content["success"] is False
                assert content["message"] == "Unknown error"
