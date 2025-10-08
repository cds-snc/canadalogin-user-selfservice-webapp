from datetime import datetime
from unittest.mock import AsyncMock, Mock

import pytest
from app.otp.schemas import OtpDeletionRequest, OtpType
from app.otp.services.delete_mfa_otp import dispatch_otp_deletion, handle_otp_deletion
from app.users.schemas import IBMVerifyUserProfileSchema, ProfileResponse
from app.utils.schemas import ResponseModel
from fastapi import HTTPException
from httpx import AsyncClient, Response


@pytest.mark.asyncio
async def test_handle_otp_deletion_sms_success(monkeypatch):
    """Test successful SMS OTP factor deletion"""

    # Mock my_profile to return a valid user profile
    async def mock_my_profile(client, token):
        return ProfileResponse(
            success=True,
            message="Profile retrieved successfully",
            data=IBMVerifyUserProfileSchema(
                id="user123",
                userName="testuser@example.com",
                active=True,
                meta={
                    "created": datetime.now().isoformat(),
                    "lastModified": datetime.now().isoformat(),
                    "location": "https://example.com/scim/v2/Users/user123",
                    "resourceType": "User",
                },
                emails=[
                    {"value": "testuser@example.com", "primary": True, "type": "work"}
                ],
                name={
                    "formatted": "Test User",
                    "givenName": "Test",
                    "familyName": "User",
                },
                phoneNumbers=[{"value": "+1 234-567-8901", "type": "mobile"}],
            ),
        )

    # Mock dispatch_otp_deletion to return successful response
    async def mock_dispatch_otp_deletion(client, deletion_request):
        mock_response = Mock(spec=Response)
        mock_response.status_code = 204  # No Content for successful deletion
        return mock_response

    monkeypatch.setattr("app.otp.services.delete_mfa_otp.my_profile", mock_my_profile)
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.dispatch_otp_deletion",
        mock_dispatch_otp_deletion,
    )

    deletion_request = OtpDeletionRequest(id="factor123", otpType=OtpType.SMS)

    async with AsyncClient(base_url="http://localhost") as client:
        result = await handle_otp_deletion(client, deletion_request, "fake-token")

        assert isinstance(result, ResponseModel)
        assert result.success is True
        assert result.data["factorId"] == "factor123"
        assert result.data["otpType"] == "sms"
        assert "deleted successfully" in result.message


@pytest.mark.asyncio
async def test_handle_otp_deletion_voice_success(monkeypatch):
    """Test successful Voice OTP factor deletion"""

    # Mock my_profile to return a valid user profile
    async def mock_my_profile(client, token):
        return ProfileResponse(
            success=True,
            message="Profile retrieved successfully",
            data=IBMVerifyUserProfileSchema(
                id="user123",
                userName="testuser@example.com",
                active=True,
                meta={
                    "created": datetime.now().isoformat(),
                    "lastModified": datetime.now().isoformat(),
                    "location": "https://example.com/scim/v2/Users/user123",
                    "resourceType": "User",
                },
                emails=[
                    {"value": "testuser@example.com", "primary": True, "type": "work"}
                ],
                name={
                    "formatted": "Test User",
                    "givenName": "Test",
                    "familyName": "User",
                },
                phoneNumbers=[{"value": "+1 234-567-8901", "type": "mobile"}],
            ),
        )

    # Mock dispatch_otp_deletion to return successful response
    async def mock_dispatch_otp_deletion(client, deletion_request):
        mock_response = Mock(spec=Response)
        mock_response.status_code = 204  # No Content for successful deletion
        return mock_response

    monkeypatch.setattr("app.otp.services.delete_mfa_otp.my_profile", mock_my_profile)
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.dispatch_otp_deletion",
        mock_dispatch_otp_deletion,
    )

    deletion_request = OtpDeletionRequest(id="factor456", otpType=OtpType.VOICE)

    async with AsyncClient(base_url="http://localhost") as client:
        result = await handle_otp_deletion(client, deletion_request, "fake-token")

        assert isinstance(result, ResponseModel)
        assert result.success is True
        assert result.data["factorId"] == "factor456"
        assert result.data["otpType"] == "voice"
        assert "deleted successfully" in result.message


@pytest.mark.asyncio
async def test_handle_otp_deletion_profile_failure(monkeypatch):
    """Test OTP deletion when profile retrieval fails"""

    # Mock my_profile to return failure
    async def mock_my_profile(client, token):
        return ProfileResponse(
            success=False,
            message="Unauthorized",
            data=None,
        )

    monkeypatch.setattr("app.otp.services.delete_mfa_otp.my_profile", mock_my_profile)

    deletion_request = OtpDeletionRequest(id="factor123", otpType=OtpType.SMS)

    async with AsyncClient(base_url="http://localhost") as client:
        result = await handle_otp_deletion(client, deletion_request, "fake-token")

        assert isinstance(result, ResponseModel)
        assert result.success is False
        assert result.message == "User verification failed"


@pytest.mark.asyncio
async def test_handle_otp_deletion_unexpected_status(monkeypatch):
    """Test OTP deletion with unexpected response status"""

    # Mock my_profile to return a valid user profile
    async def mock_my_profile(client, token):
        return ProfileResponse(
            success=True,
            message="Profile retrieved successfully",
            data=IBMVerifyUserProfileSchema(
                id="user123",
                userName="testuser@example.com",
                active=True,
                meta={
                    "created": datetime.now().isoformat(),
                    "lastModified": datetime.now().isoformat(),
                    "location": "https://example.com/scim/v2/Users/user123",
                    "resourceType": "User",
                },
                emails=[
                    {"value": "testuser@example.com", "primary": True, "type": "work"}
                ],
                name={
                    "formatted": "Test User",
                    "givenName": "Test",
                    "familyName": "User",
                },
                phoneNumbers=[{"value": "+1 234-567-8901", "type": "mobile"}],
            ),
        )

    # Mock dispatch_otp_deletion to return unexpected status
    async def mock_dispatch_otp_deletion(client, deletion_request):
        mock_response = Mock(spec=Response)
        mock_response.status_code = 200  # Unexpected status for deletion
        return mock_response

    monkeypatch.setattr("app.otp.services.delete_mfa_otp.my_profile", mock_my_profile)
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.dispatch_otp_deletion",
        mock_dispatch_otp_deletion,
    )

    deletion_request = OtpDeletionRequest(id="factor123", otpType=OtpType.SMS)

    async with AsyncClient(base_url="http://localhost") as client:
        result = await handle_otp_deletion(client, deletion_request, "fake-token")

        assert isinstance(result, ResponseModel)
        assert result.success is False


@pytest.mark.asyncio
async def test_handle_otp_deletion_exception(monkeypatch):
    """Test OTP deletion when an exception occurs"""

    # Mock my_profile to return a valid user profile
    async def mock_my_profile(client, token):
        return ProfileResponse(
            success=True,
            message="Profile retrieved successfully",
            data=IBMVerifyUserProfileSchema(
                id="user123",
                userName="testuser@example.com",
                active=True,
                meta={
                    "created": datetime.now().isoformat(),
                    "lastModified": datetime.now().isoformat(),
                    "location": "https://example.com/scim/v2/Users/user123",
                    "resourceType": "User",
                },
                emails=[
                    {"value": "testuser@example.com", "primary": True, "type": "work"}
                ],
                name={
                    "formatted": "Test User",
                    "givenName": "Test",
                    "familyName": "User",
                },
                phoneNumbers=[{"value": "+1 234-567-8901", "type": "mobile"}],
            ),
        )

    # Mock dispatch_otp_deletion to raise an exception
    async def mock_dispatch_otp_deletion(client, deletion_request):
        raise Exception("Network error")

    monkeypatch.setattr("app.otp.services.delete_mfa_otp.my_profile", mock_my_profile)
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.dispatch_otp_deletion",
        mock_dispatch_otp_deletion,
    )

    deletion_request = OtpDeletionRequest(id="factor123", otpType=OtpType.SMS)

    async with AsyncClient(base_url="http://localhost") as client:
        with pytest.raises(HTTPException) as exc_info:
            await handle_otp_deletion(client, deletion_request, "fake-token")

        assert exc_info.value.status_code == 500
        assert "Network error" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_dispatch_otp_deletion_sms_success(monkeypatch):
    """Test successful dispatch of SMS OTP deletion to IBM Verify"""

    # Mock get_admin_token
    async def mock_get_admin_token(client):
        return "admin-token"

    # Mock get_auth_request_headers
    def mock_get_auth_request_headers(token, content_type):
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # Mock get_configuration
    def mock_get_configuration():
        config = Mock()
        config.ibm_verify_config.IBM_VERIFY_TENANT_URL = "https://test.verify.ibm.com"
        return config

    # Mock HTTP client delete
    mock_client = AsyncMock(spec=AsyncClient)
    mock_response = Mock(spec=Response)
    mock_response.status_code = 204
    mock_response.raise_for_status = Mock()
    mock_client.delete.return_value = mock_response

    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_admin_token", mock_get_admin_token
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_auth_request_headers",
        mock_get_auth_request_headers,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_configuration", mock_get_configuration
    )

    deletion_request = OtpDeletionRequest(id="factor123", otpType=OtpType.SMS)

    result = await dispatch_otp_deletion(mock_client, deletion_request)

    assert result.status_code == 204
    mock_client.delete.assert_called_once_with(
        "https://test.verify.ibm.com/v2.0/factors/smsotp/factor123",
        headers={
            "Authorization": "Bearer admin-token",
            "Content-Type": "application/json",
        },
    )


@pytest.mark.asyncio
async def test_dispatch_otp_deletion_voice_success(monkeypatch):
    """Test successful dispatch of Voice OTP deletion to IBM Verify"""

    # Mock get_admin_token
    async def mock_get_admin_token(client):
        return "admin-token"

    # Mock get_auth_request_headers
    def mock_get_auth_request_headers(token, content_type):
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # Mock get_configuration
    def mock_get_configuration():
        config = Mock()
        config.ibm_verify_config.IBM_VERIFY_TENANT_URL = "https://test.verify.ibm.com"
        return config

    # Mock HTTP client delete
    mock_client = AsyncMock(spec=AsyncClient)
    mock_response = Mock(spec=Response)
    mock_response.status_code = 204
    mock_response.raise_for_status = Mock()
    mock_client.delete.return_value = mock_response

    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_admin_token", mock_get_admin_token
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_auth_request_headers",
        mock_get_auth_request_headers,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_configuration", mock_get_configuration
    )

    deletion_request = OtpDeletionRequest(id="factor456", otpType=OtpType.VOICE)

    result = await dispatch_otp_deletion(mock_client, deletion_request)

    assert result.status_code == 204
    mock_client.delete.assert_called_once_with(
        "https://test.verify.ibm.com/v2.0/factors/voiceotp/factor456",
        headers={
            "Authorization": "Bearer admin-token",
            "Content-Type": "application/json",
        },
    )


@pytest.mark.asyncio
async def test_dispatch_otp_deletion_unsupported_type():
    """Test dispatch with unsupported OTP type"""
    deletion_request = OtpDeletionRequest(id="factor123", otpType=OtpType.EMAIL)

    mock_client = AsyncMock(spec=AsyncClient)

    with pytest.raises(ValueError) as exc_info:
        await dispatch_otp_deletion(mock_client, deletion_request)

    assert "Unsupported OTP type" in str(exc_info.value)


@pytest.mark.asyncio
async def test_dispatch_otp_deletion_http_error(monkeypatch):
    """Test dispatch when HTTP error occurs"""
    from httpx import HTTPStatusError

    # Mock get_admin_token
    async def mock_get_admin_token(client):
        return "admin-token"

    # Mock get_auth_request_headers
    def mock_get_auth_request_headers(token, content_type):
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # Mock get_configuration
    def mock_get_configuration():
        config = Mock()
        config.ibm_verify_config.IBM_VERIFY_TENANT_URL = "https://test.verify.ibm.com"
        return config

    # Mock RequestErrorHandler
    def mock_handle_error(error):
        return Mock(status_code=404)

    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_admin_token", mock_get_admin_token
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_auth_request_headers",
        mock_get_auth_request_headers,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_configuration", mock_get_configuration
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.RequestErrorHandler.handle", mock_handle_error
    )

    # Mock HTTP client to raise HTTPStatusError
    mock_client = AsyncMock(spec=AsyncClient)
    mock_request = Mock()
    mock_request.url = "https://test.verify.ibm.com/v2.0/factors/smsotp/factor123"
    mock_response = Mock()
    mock_response.status_code = 404
    mock_response.request = mock_request

    http_error = HTTPStatusError(
        "Not found", request=mock_request, response=mock_response
    )
    mock_client.delete.side_effect = http_error

    deletion_request = OtpDeletionRequest(id="factor123", otpType=OtpType.SMS)

    result = await dispatch_otp_deletion(mock_client, deletion_request)

    assert result.status_code == 404


@pytest.mark.asyncio
async def test_dispatch_otp_deletion_generic_exception(monkeypatch):
    """Test dispatch when generic exception occurs"""

    # Mock get_admin_token
    async def mock_get_admin_token(client):
        return "admin-token"

    # Mock get_auth_request_headers
    def mock_get_auth_request_headers(token, content_type):
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # Mock get_configuration
    def mock_get_configuration():
        config = Mock()
        config.ibm_verify_config.IBM_VERIFY_TENANT_URL = "https://test.verify.ibm.com"
        return config

    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_admin_token", mock_get_admin_token
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_auth_request_headers",
        mock_get_auth_request_headers,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_configuration", mock_get_configuration
    )

    # Mock HTTP client to raise generic exception
    mock_client = AsyncMock(spec=AsyncClient)
    mock_client.delete.side_effect = Exception("Connection timeout")

    deletion_request = OtpDeletionRequest(id="factor123", otpType=OtpType.SMS)

    with pytest.raises(Exception) as exc_info:
        await dispatch_otp_deletion(mock_client, deletion_request)

    assert "Connection timeout" in str(exc_info.value)
