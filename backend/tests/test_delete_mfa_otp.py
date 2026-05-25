from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, Mock

import pytest
from app.otp.schemas import (
    OtpBatchDeletionRequest,
    OtpDeletionRequest,
    OtpFactorItem,
    OtpType,
)
from app.otp.services.delete_mfa_otp import (
    dispatch_otp_deletion,
    handle_otp_batch_deletion,
    handle_otp_deletion,
)
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
submit_assertion_import_path = "app.otp.services.delete_mfa_otp.submit_assertion_result"


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


def create_assertion_result():
    return {
        "id": "credential-123",
        "rawId": "credential-123",
        "type": "public-key",
        "response": {
            "clientDataJSON": "client-data",
            "signature": "signature-data",
            "authenticatorData": "authenticator-data",
        },
    }


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
                contactNumber="+12345678901",
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
                contactNumber="+12345678901",
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
                contactNumber="+12345678901",
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
async def test_handle_otp_deletion_passkey_authorized_success(monkeypatch):
    """Test successful deletion of a validated OTP factor with passkey authorization."""

    async def mock_submit_assertion_result(
        request, http_client, user_access_token, request_body, return_jwt=False
    ):
        return ResponseModel(
            success=True,
            data={"assertion": "verified"},
            message="FIDO2 authentication completed successfully",
        )

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

    async def mock_get_user_otp_factors(client, user_id, validated=True):
        return create_mock_user_factors(num_factors=2)

    async def mock_dispatch_otp_deletion(
        client, deletion_request, user_access_token, language=None
    ):
        mock_response = Mock(spec=Response)
        mock_response.status_code = 204
        return mock_response

    monkeypatch.setattr(
        submit_assertion_import_path,
        mock_submit_assertion_result,
        raising=False,
    )
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

    deletion_request = OtpDeletionRequest(
        id="factor123",
        otpType=OtpType.SMS,
        assertionResult=create_assertion_result(),
    )
    mock_request = MagicMock()

    async with AsyncClient(base_url="http://localhost") as client:
        result = await handle_otp_deletion(
            request=mock_request,
            global_http_client=client,
            deletion_request=deletion_request,
            user_access_token="fake-token",
        )

    assert isinstance(result, ResponseModel)
    assert result.success is True
    assert result.data["factorId"] == "factor123"
    assert result.data["otpType"] == "sms"


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
                contactNumber="+12345678901",
            ),
        )

    # When validated=False, return the target factor so the unvalidated check passes.
    # Other validated values are not called in the no-otp path.
    async def mock_get_user_otp_factors(client, user_id, validated=True):
        if validated is False:
            return create_mock_user_factors(
                num_factors=1
            )  # factor1 id matches "factor123"? No, let's use a custom one.
        return create_mock_user_factors(num_factors=2)

    # Return a response that contains factor123 as unvalidated
    async def mock_get_user_otp_factors_with_target(client, user_id, validated=True):
        if validated is False:
            from app.users.schemas import UserPhoneOTP, UserPhoneAuthFactorsResponse

            return UserPhoneAuthFactorsResponse(
                success=True,
                message="User factors retrieved successfully",
                data=[
                    UserPhoneOTP(
                        id="factor123",
                        type=PasswordOtpType.SMSOTP,
                        destination="5551234567",
                    )
                ],
            )
        return create_mock_user_factors(num_factors=2)

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
        mock_get_user_otp_factors_with_target,
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
    """Test that attempting to delete a validated factor without OTP raises HTTP 400.
    Batch deletion of validated factors must use the dedicated batch endpoint."""

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
                contactNumber="+12345678901",
            ),
        )

    # When validated=False, return an EMPTY list — the factor is not unvalidated.
    async def mock_get_user_otp_factors(client, user_id, validated=True):
        if validated is False:
            from app.users.schemas import UserPhoneAuthFactorsResponse

            return UserPhoneAuthFactorsResponse(
                success=True, message="No unvalidated factors", data=[]
            )
        return create_mock_user_factors(num_factors=2)

    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_my_profile",
        mock_get_my_profile,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_user_otp_factors",
        mock_get_user_otp_factors,
    )

    # Request without otp/trxnId/otpVerificationType — validated factor, no OTP → must fail
    deletion_request = OtpDeletionRequest(id="factor123", otpType=OtpType.SMS)

    async with AsyncClient(base_url="http://localhost") as client:
        with pytest.raises(HTTPException) as exc_info:
            await handle_otp_deletion(client, deletion_request, "fake-token")

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "OTP verification is required" in str(exc_info.value.detail)


# ---------------------------------------------------------------------------
# Tests for handle_otp_batch_deletion
# ---------------------------------------------------------------------------


def create_batch_deletion_request(
    factor_ids=None,
    otp="123456",
    trxn_id="txn123",
    verification_type=OtpType.SMS,
):
    """Helper to create an OtpBatchDeletionRequest."""
    if factor_ids is None:
        factor_ids = [("factor1", OtpType.SMS), ("factor2", OtpType.VOICE)]
    return OtpBatchDeletionRequest(
        factors=[OtpFactorItem(id=fid, otpType=ftype) for fid, ftype in factor_ids],
        otp=otp,
        trxnId=trxn_id,
        otpVerificationType=verification_type,
    )


@pytest.mark.asyncio
async def test_handle_otp_batch_deletion_success(monkeypatch):
    """Test successful batch deletion of multiple OTP factors"""

    async def mock_verify_otp(
        global_http_client, otp, trxn_id, otp_type, user_access_token
    ):
        return None

    async def mock_get_user_otp_factors(client, user_id, validated=True):
        return create_mock_user_factors(
            num_factors=3
        )  # 3 total, deleting 2 → 1 remains

    async def mock_dispatch_otp_deletion(client, deletion_request, user_access_token):
        mock_response = Mock(spec=Response)
        mock_response.status_code = 204
        return mock_response

    monkeypatch.setattr(verify_otp_import_path, mock_verify_otp)
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_user_otp_factors",
        mock_get_user_otp_factors,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.dispatch_otp_deletion",
        mock_dispatch_otp_deletion,
    )

    batch_request = create_batch_deletion_request()

    async with AsyncClient(base_url="http://localhost") as client:
        result = await handle_otp_batch_deletion(client, batch_request, "fake-token")

    assert isinstance(result, ResponseModel)
    assert result.success is True
    assert len(result.data["deletedFactors"]) == 2
    assert result.data["deletedFactors"][0]["factorId"] == "factor1"
    assert result.data["deletedFactors"][1]["factorId"] == "factor2"
    assert "2 MFA factor(s) deleted" in result.message


@pytest.mark.asyncio
async def test_handle_otp_batch_deletion_last_factor_protection(monkeypatch):
    """Test that batch deletion is prevented when it would remove the last factor"""

    async def mock_verify_otp(
        global_http_client, otp, trxn_id, otp_type, user_access_token
    ):
        return None

    # Only 2 total factors; trying to delete both → would leave 0
    async def mock_get_user_otp_factors(client, user_id, validated=True):
        return create_mock_user_factors(num_factors=2)

    monkeypatch.setattr(verify_otp_import_path, mock_verify_otp)
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_user_otp_factors",
        mock_get_user_otp_factors,
    )

    batch_request = create_batch_deletion_request(
        factor_ids=[("factor1", OtpType.SMS), ("factor2", OtpType.VOICE)]
    )

    async with AsyncClient(base_url="http://localhost") as client:
        with pytest.raises(HTTPException) as exc_info:
            await handle_otp_batch_deletion(client, batch_request, "fake-token")

    assert exc_info.value.status_code == status.HTTP_409_CONFLICT
    assert "Cannot delete last remaining MFA factor" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_handle_otp_batch_deletion_otp_failure(monkeypatch):
    """Test that batch deletion is aborted when OTP verification fails"""

    async def mock_verify_otp_fail(
        global_http_client, otp, trxn_id, otp_type, user_access_token
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP",
        )

    monkeypatch.setattr(verify_otp_import_path, mock_verify_otp_fail)

    batch_request = create_batch_deletion_request()

    async with AsyncClient(base_url="http://localhost") as client:
        with pytest.raises(HTTPException) as exc_info:
            await handle_otp_batch_deletion(client, batch_request, "fake-token")

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_handle_otp_batch_deletion_passkey_authorized_success(monkeypatch):
    """Test successful batch deletion of OTP factors with passkey authorization."""

    async def mock_submit_assertion_result(
        request, http_client, user_access_token, request_body, return_jwt=False
    ):
        return ResponseModel(
            success=True,
            data={"assertion": "verified"},
            message="FIDO2 authentication completed successfully",
        )

    async def mock_get_user_otp_factors(client, user_id, validated=True):
        return create_mock_user_factors(num_factors=3)

    async def mock_dispatch_otp_deletion(client, deletion_request, user_access_token):
        mock_response = Mock(spec=Response)
        mock_response.status_code = 204
        return mock_response

    monkeypatch.setattr(
        submit_assertion_import_path,
        mock_submit_assertion_result,
        raising=False,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.get_user_otp_factors",
        mock_get_user_otp_factors,
    )
    monkeypatch.setattr(
        "app.otp.services.delete_mfa_otp.dispatch_otp_deletion",
        mock_dispatch_otp_deletion,
    )

    batch_request = OtpBatchDeletionRequest(
        factors=[
            OtpFactorItem(id="factor1", otpType=OtpType.SMS),
            OtpFactorItem(id="factor2", otpType=OtpType.VOICE),
        ],
        assertionResult=create_assertion_result(),
    )
    mock_request = MagicMock()

    async with AsyncClient(base_url="http://localhost") as client:
        result = await handle_otp_batch_deletion(
            request=mock_request,
            global_http_client=client,
            deletion_request=batch_request,
            user_access_token="fake-token",
        )

    assert isinstance(result, ResponseModel)
    assert result.success is True
    assert len(result.data["deletedFactors"]) == 2
