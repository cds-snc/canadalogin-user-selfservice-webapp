from datetime import datetime
from unittest.mock import AsyncMock, Mock

import pytest
from app.otp.schemas import OtpDeletionRequest, OtpType
from app.otp.services.delete_mfa_otp import dispatch_otp_deletion, handle_otp_deletion
from app.password.schemas import OtpType as PasswordOtpType
from app.users.schemas import (
    IBMVerifyUserProfileSchema,
    ProfileResponse,
    UserPhoneAuthFactorsResponse,
    UserPhoneOTP,
)
from app.utils.schemas import ResponseModel
from fastapi import HTTPException, status
from httpx import AsyncClient, Response

verify_otp_import_path = "app.otp.services.delete_mfa_otp.verify_otp_before_operation"


def create_mock_user_factors(num_factors=2):
    """Helper function to create mock user factors response"""
    factors = []
    for i in range(num_factors):
        # Use PasswordOtpType for UserPhoneOTP which expects "smsotp"/"voiceotp"
        factor_type = PasswordOtpType.SMSOTP if i % 2 == 0 else PasswordOtpType.VOICEOTP
        factors.append(
            UserPhoneOTP(
                id=f"factor{i + 1}", type=factor_type, destination="5551234567"
            )
        )

    return UserPhoneAuthFactorsResponse(
        success=True, message="User factors retrieved successfully", data=factors
    )


def create_deletion_request(
    factor_id="factor123", otp_type=OtpType.SMS, verification_type=None
):
    """Helper function to create OtpDeletionRequest with all required fields"""
    if verification_type is None:
        verification_type = otp_type
    return OtpDeletionRequest(
        id=factor_id,
        otpType=otp_type,
        otp="123456",
        trxnId="txn123",
        otpVerificationType=verification_type,
    )


@pytest.mark.asyncio
async def test_handle_otp_deletion_sms_success(monkeypatch):
    """Test successful SMS OTP factor deletion"""

    # Mock verify_otp_before_operation to succeed
    async def mock_verify_otp(
        global_http_client, otp, trxn_id, otp_type, user_access_token
    ):
        return None  # Success means no exception

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

    # Mock get_user_otp_factors to return multiple factors (so deletion is allowed)
    async def mock_get_user_otp_factors(client, user_id, validated=True):
        return create_mock_user_factors(num_factors=2)

    # Mock dispatch_otp_deletion to return successful response
    async def mock_dispatch_otp_deletion(
        client, deletion_request, user_access_token, language=None
    ):
        mock_response = Mock(spec=Response)
        mock_response.status_code = 204  # No Content for successful deletion
        return mock_response

    monkeypatch.setattr(verify_otp_import_path, mock_verify_otp)
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_my_profile",
        mock_my_profile,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_user_otp_factors",
        mock_get_user_otp_factors,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.dispatch_otp_deletion",
        mock_dispatch_otp_deletion,
    )

    deletion_request = create_deletion_request()

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

    # Mock verify_otp_before_operation to succeed
    async def mock_verify_otp(
        global_http_client, otp, trxn_id, otp_type, user_access_token
    ):
        return None  # Success means no exception

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

    # Mock get_user_otp_factors to return multiple factors (so deletion is allowed)
    async def mock_get_user_otp_factors(client, user_id, validated=True):
        return create_mock_user_factors(num_factors=2)

    # Mock dispatch_otp_deletion to return successful response
    async def mock_dispatch_otp_deletion(
        client, deletion_request, user_access_token, language=None
    ):
        mock_response = Mock(spec=Response)
        mock_response.status_code = 204  # No Content for successful deletion
        return mock_response

    monkeypatch.setattr(verify_otp_import_path, mock_verify_otp)
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_my_profile",
        mock_my_profile,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_user_otp_factors",
        mock_get_user_otp_factors,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.dispatch_otp_deletion",
        mock_dispatch_otp_deletion,
    )

    deletion_request = create_deletion_request(
        factor_id="factor456", otp_type=OtpType.VOICE
    )

    async with AsyncClient(base_url="http://localhost") as client:
        result = await handle_otp_deletion(client, deletion_request, "fake-token")

        assert isinstance(result, ResponseModel)
        assert result.success is True
        assert result.data["factorId"] == "factor456"
        assert result.data["otpType"] == "voice"
        assert "deleted successfully" in result.message


@pytest.mark.asyncio
async def test_handle_otp_deletion_last_factor_protection(monkeypatch):
    """Test OTP deletion when user has only one factor (should fail)"""

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

    # Mock get_user_otp_factors to return only ONE factor (should prevent deletion)
    async def mock_get_user_otp_factors(client, user_id, validated=True):
        return create_mock_user_factors(num_factors=1)

    # Mock verify_otp_before_operation to succeed
    async def mock_verify_otp(
        global_http_client, otp, trxn_id, otp_type, user_access_token
    ):
        return None  # Success means no exception

    monkeypatch.setattr(verify_otp_import_path, mock_verify_otp)
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_my_profile",
        mock_my_profile,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_user_otp_factors",
        mock_get_user_otp_factors,
    )

    deletion_request = create_deletion_request()

    async with AsyncClient(base_url="http://localhost") as client:
        with pytest.raises(HTTPException) as exc_info:
            await handle_otp_deletion(client, deletion_request, "fake-token")

        assert exc_info.value.status_code == status.HTTP_409_CONFLICT
        assert "Cannot delete last remaining MFA factor" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_dispatch_otp_deletion_sms_success(monkeypatch):
    """Test successful dispatch of SMS OTP deletion to IBM Verify"""

    # Mock get_auth_request_headers
    def mock_get_auth_request_headers(token, content_type, language=None):
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
        "app.otp.services.delete_mfa_otp.get_auth_request_headers",
        mock_get_auth_request_headers,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_configuration", mock_get_configuration
    )

    deletion_request = create_deletion_request()

    result = await dispatch_otp_deletion(mock_client, deletion_request, "user-token")

    assert result.status_code == 204
    mock_client.delete.assert_called_once_with(
        "https://test.verify.ibm.com/v2.0/factors/smsotp/factor123",
        headers={
            "Authorization": "Bearer user-token",
            "Content-Type": "application/json",
        },
    )


@pytest.mark.asyncio
async def test_dispatch_otp_deletion_voice_success(monkeypatch):
    """Test successful dispatch of Voice OTP deletion to IBM Verify"""

    # Mock get_auth_request_headers
    def mock_get_auth_request_headers(token, content_type, language=None):
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
        "app.otp.services.delete_mfa_otp.get_auth_request_headers",
        mock_get_auth_request_headers,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_configuration", mock_get_configuration
    )

    deletion_request = create_deletion_request(
        factor_id="factor456", otp_type=OtpType.VOICE
    )

    result = await dispatch_otp_deletion(mock_client, deletion_request, "user-token")

    assert result.status_code == 204
    mock_client.delete.assert_called_once_with(
        "https://test.verify.ibm.com/v2.0/factors/voiceotp/factor456",
        headers={
            "Authorization": "Bearer user-token",
            "Content-Type": "application/json",
        },
    )


@pytest.mark.asyncio
async def test_handle_otp_deletion_unvalidated_factor_success(monkeypatch):
    """Test successful deletion of an unvalidated OTP factor without OTP verification"""

    async def mock_get_my_profile(client, token):
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

    # Mock get_user_otp_factors to return the factor as unvalidated
    async def mock_get_user_otp_factors(client, user_id, validated=True):
        return UserPhoneAuthFactorsResponse(
            success=True,
            message="Factors retrieved",
            data=[
                UserPhoneOTP(
                    id="factor123",
                    type=PasswordOtpType.SMSOTP,
                    destination="5551234567",
                )
            ],
        )

    # Mock dispatch_otp_deletion to return successful response
    async def mock_dispatch_otp_deletion(
        client, deletion_request, user_access_token, language=None
    ):
        mock_response = Mock(spec=Response)
        mock_response.status_code = 204
        return mock_response

    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_my_profile",
        mock_get_my_profile,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_user_otp_factors",
        mock_get_user_otp_factors,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.dispatch_otp_deletion",
        mock_dispatch_otp_deletion,
    )

    # Request without otp/trxnId/otpVerificationType — unvalidated factor
    deletion_request = OtpDeletionRequest(id="factor123", otpType=OtpType.SMS)

    async with AsyncClient(base_url="http://localhost") as client:
        result = await handle_otp_deletion(client, deletion_request, "fake-token")

    assert isinstance(result, ResponseModel)
    assert result.success is True
    assert result.data["factorId"] == "factor123"
    assert result.data["otpType"] == "sms"
    assert "deleted successfully" in result.message


@pytest.mark.asyncio
async def test_handle_otp_deletion_validated_factor_without_otp(monkeypatch):
    """Test that deletion is rejected when no OTP provided for a validated factor"""

    async def mock_get_my_profile(client, token):
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

    # Factor is not in the unvalidated list — it is validated
    async def mock_get_user_otp_factors(client, user_id, validated=True):
        return UserPhoneAuthFactorsResponse(
            success=True,
            message="Factors retrieved",
            data=[],  # Empty — factor not found among unvalidated factors
        )

    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_my_profile",
        mock_get_my_profile,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_user_otp_factors",
        mock_get_user_otp_factors,
    )

    # Request without otp/trxnId/otpVerificationType — but factor is validated
    deletion_request = OtpDeletionRequest(id="factor123", otpType=OtpType.SMS)

    async with AsyncClient(base_url="http://localhost") as client:
        with pytest.raises(HTTPException) as exc_info:
            await handle_otp_deletion(client, deletion_request, "fake-token")

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "OTP verification required" in str(exc_info.value.detail)
