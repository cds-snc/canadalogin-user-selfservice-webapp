import pytest
from unittest.mock import AsyncMock, Mock, patch
from fastapi import HTTPException
from httpx import AsyncClient, HTTPStatusError, Request, Response

from app.otp.schemas import OtpType
from app.users.schemas import (
    ProfileUpdateWithOtpRequest,
    UserProfileName,
    EmailItem,
    MetaDataTypeValue,
    IBMVerifyUserProfileSchema,
)
from app.users.services.update_profile_with_otp import (
    update_profile_with_otp_verification,
    EmailMfaSyncContext,
    _build_email_mfa_sync_context,
    _delete_old_email_mfa_factors,
    _enroll_and_validate_new_email_mfa_factor,
    _build_profile_update_request,
    _get_update_field_names,
    _build_session_updates,
    _validate_new_email_address,
)


class TestBuildProfileUpdateRequest:
    """Test the _build_profile_update_request helper function"""

    def test_email_update_replaces_existing_work_email(self):
        """Test that updating email replaces existing work email while preserving others"""
        # Arrange
        update_data = ProfileUpdateWithOtpRequest(
            newEmailAddress="newemail@example.com",
            otp="123456",
            trxnId="test-trxn",
            otpType=OtpType.EMAIL,
        )

        # Mock current profile with multiple emails including a work email
        current_profile = Mock()
        current_profile.userName = "oldemail@example.com"
        current_profile.preferredLanguage = "en"
        current_profile.name = UserProfileName(givenName="John", familyName="Doe")
        current_profile.phoneNumbers = []
        current_profile.emails = [
            EmailItem(type="personal", value="personal@example.com"),
            EmailItem(type="work", value="oldemail@example.com"),
            EmailItem(type="backup", value="backup@example.com"),
        ]

        # Act
        result = _build_profile_update_request(update_data, current_profile)

        # Assert
        assert result.userName == "newemail@example.com"
        assert len(result.emails) == 3

        # Check that work email was replaced
        work_email = next(
            (email for email in result.emails if email.type == "work"), None
        )
        assert work_email is not None
        assert work_email.value == "newemail@example.com"

        # Check that other emails are preserved
        personal_email = next(
            (email for email in result.emails if email.type == "personal"), None
        )
        backup_email = next(
            (email for email in result.emails if email.type == "backup"), None
        )
        assert personal_email is not None
        assert personal_email.value == "personal@example.com"
        assert backup_email is not None
        assert backup_email.value == "backup@example.com"

    def test_email_update_adds_work_email_when_none_exists(self):
        """Test that updating email adds work email when none exists"""
        # Arrange
        update_data = ProfileUpdateWithOtpRequest(
            newEmailAddress="newemail@example.com",
            otp="123456",
            trxnId="test-trxn",
            otpType=OtpType.EMAIL,
        )

        # Mock current profile with no work email
        current_profile = Mock()
        current_profile.userName = "oldemail@example.com"
        current_profile.preferredLanguage = "en"
        current_profile.name = UserProfileName(givenName="John", familyName="Doe")
        current_profile.phoneNumbers = []
        current_profile.emails = [
            EmailItem(type="personal", value="personal@example.com"),
            EmailItem(type="backup", value="backup@example.com"),
        ]

        # Act
        result = _build_profile_update_request(update_data, current_profile)

        # Assert
        assert result.userName == "newemail@example.com"
        assert len(result.emails) == 3

        # Check that work email was added
        work_email = next(
            (email for email in result.emails if email.type == "work"), None
        )
        assert work_email is not None
        assert work_email.value == "newemail@example.com"

        # Check that other emails are preserved
        personal_email = next(
            (email for email in result.emails if email.type == "personal"), None
        )
        backup_email = next(
            (email for email in result.emails if email.type == "backup"), None
        )
        assert personal_email is not None
        assert personal_email.value == "personal@example.com"
        assert backup_email is not None
        assert backup_email.value == "backup@example.com"

    def test_email_update_handles_empty_emails_list(self):
        """Test that updating email works when current profile has no emails"""
        # Arrange
        update_data = ProfileUpdateWithOtpRequest(
            newEmailAddress="newemail@example.com",
            otp="123456",
            trxnId="test-trxn",
            otpType=OtpType.EMAIL,
        )

        # Mock current profile with no emails
        current_profile = Mock()
        current_profile.userName = "oldemail@example.com"
        current_profile.preferredLanguage = "en"
        current_profile.name = UserProfileName(givenName="John", familyName="Doe")
        current_profile.phoneNumbers = []
        current_profile.emails = []

        # Act
        result = _build_profile_update_request(update_data, current_profile)

        # Assert
        assert result.userName == "newemail@example.com"
        assert len(result.emails) == 1

        # Check that work email was added
        work_email = result.emails[0]
        assert work_email.type == "work"
        assert work_email.value == "newemail@example.com"

    def test_email_update_handles_none_emails(self):
        """Test that updating email works when current profile emails is None"""
        # Arrange
        update_data = ProfileUpdateWithOtpRequest(
            newEmailAddress="newemail@example.com",
            otp="123456",
            trxnId="test-trxn",
            otpType=OtpType.EMAIL,
        )

        # Mock current profile with None emails
        current_profile = Mock()
        current_profile.userName = "oldemail@example.com"
        current_profile.preferredLanguage = "en"
        current_profile.name = UserProfileName(givenName="John", familyName="Doe")
        current_profile.phoneNumbers = []
        current_profile.emails = None

        # Act
        result = _build_profile_update_request(update_data, current_profile)

        # Assert
        assert result.userName == "newemail@example.com"
        assert len(result.emails) == 1

        # Check that work email was added
        work_email = result.emails[0]
        assert work_email.type == "work"
        assert work_email.value == "newemail@example.com"

    def test_phone_number_update_preserves_current_profile(self):
        """Test that when updating phone numbers, other profile fields are preserved"""
        # Arrange
        new_phone_numbers = [MetaDataTypeValue(type="work", value="+19876543210")]
        update_data = ProfileUpdateWithOtpRequest(
            phoneNumbers=new_phone_numbers,
            otp="123456",
            trxnId="test-trxn",
            otpType=OtpType.SMS,
        )

        # Mock current profile
        current_profile = Mock()
        current_profile.userName = "test@example.com"
        current_profile.preferredLanguage = "en"
        current_profile.name = UserProfileName(givenName="John", familyName="Doe")
        current_profile.phoneNumbers = [
            MetaDataTypeValue(type="work", value="+11234567890")
        ]
        current_profile.emails = [EmailItem(type="work", value="test@example.com")]

        # Act
        result = _build_profile_update_request(update_data, current_profile)

        # Assert
        # userName and emails should remain unchanged when updating phone numbers
        assert result.userName == "test@example.com"
        # Phone numbers should be updated
        assert result.phoneNumbers == new_phone_numbers
        assert result.phoneNumbers[0].value == "+19876543210"


# Import paths for mocking
VERIFY_OTP_IMPORT_PATH = (
    "app.users.services.update_profile_with_otp.verify_otp_before_operation"
)
GET_PROFILE_FROM_IBM_IMPORT_PATH = (
    "app.users.services.update_profile_with_otp.dispatch_get_my_profile_from_ibm"
)
UPDATE_PROFILE_IMPORT_PATH = (
    "app.users.services.update_profile_with_otp.update_profile_for_verified_changes"
)
UPDATE_SESSION_IMPORT_PATH = (
    "app.users.services.update_profile_with_otp.update_session_user_info"
)
BUILD_EMAIL_MFA_SYNC_CONTEXT_IMPORT_PATH = (
    "app.users.services.update_profile_with_otp._build_email_mfa_sync_context"
)
DELETE_OLD_EMAIL_MFA_IMPORT_PATH = (
    "app.users.services.update_profile_with_otp._delete_old_email_mfa_factors"
)
ENROLL_VALIDATE_EMAIL_MFA_IMPORT_PATH = "app.users.services.update_profile_with_otp._enroll_and_validate_new_email_mfa_factor"
RESTORE_OLD_EMAIL_MFA_IMPORT_PATH = "app.users.services.update_profile_with_otp._restore_old_email_mfa_factor_after_failed_update"
PREFLIGHT_EMAIL_CHECK_IMPORT_PATH = (
    "app.users.services.update_profile_with_otp._is_email_already_associated"
)


class TestUpdateProfileWithOtpVerification:
    """Test the main update_profile_with_otp_verification function"""

    def test_validate_new_email_address_rejects_email_over_128_characters(self):
        """Backend should return frontend-compatible code for long emails."""
        valid_over_128_email = f"user@{'a' * 63}.{'b' * 56}.com"

        with pytest.raises(HTTPException) as exc:
            _validate_new_email_address(valid_over_128_email)

        assert exc.value.status_code == 400
        assert exc.value.detail == "email_too_long"

    def test_validate_new_email_address_rejects_non_ascii_email(self):
        """Backend should return frontend-compatible code for non-ASCII emails."""
        with pytest.raises(HTTPException) as exc:
            _validate_new_email_address("josé@example.com")

        assert exc.value.status_code == 400
        assert exc.value.detail == "email_accented_characters"

    @pytest.mark.asyncio
    @patch(GET_PROFILE_FROM_IBM_IMPORT_PATH)
    @patch(VERIFY_OTP_IMPORT_PATH)
    async def test_invalid_email_too_long_prevents_otp_verification(
        self, mock_verify_otp, mock_get_profile
    ):
        """Business-rule email validation should fail before OTP verification."""
        mock_request = Mock()
        mock_request.app = Mock()
        mock_request.app.state = Mock()
        mock_request.app.state.request_client = Mock(spec=AsyncClient)

        profile_update_data = ProfileUpdateWithOtpRequest.model_construct(
            otp="123456",
            trxnId="test-trxn-id",
            otpType=OtpType.EMAIL,
            newEmailAddress=f"user@{'a' * 63}.{'b' * 56}.com",
            phoneNumbers=None,
        )

        with pytest.raises(HTTPException) as exc:
            await update_profile_with_otp_verification(
                mock_request, profile_update_data, "user-token"
            )

        assert exc.value.status_code == 400
        assert exc.value.detail == "email_too_long"
        mock_verify_otp.assert_not_called()
        mock_get_profile.assert_not_called()

    @pytest.mark.asyncio
    @patch(GET_PROFILE_FROM_IBM_IMPORT_PATH)
    @patch(VERIFY_OTP_IMPORT_PATH)
    async def test_invalid_email_accented_prevents_otp_verification(
        self, mock_verify_otp, mock_get_profile
    ):
        """Non-ASCII email validation should fail before OTP verification."""
        mock_request = Mock()
        mock_request.app = Mock()
        mock_request.app.state = Mock()
        mock_request.app.state.request_client = Mock(spec=AsyncClient)

        profile_update_data = ProfileUpdateWithOtpRequest.model_construct(
            otp="123456",
            trxnId="test-trxn-id",
            otpType=OtpType.EMAIL,
            newEmailAddress="josé@example.com",
            phoneNumbers=None,
        )

        with pytest.raises(HTTPException) as exc:
            await update_profile_with_otp_verification(
                mock_request, profile_update_data, "user-token"
            )

        assert exc.value.status_code == 400
        assert exc.value.detail == "email_accented_characters"
        mock_verify_otp.assert_not_called()
        mock_get_profile.assert_not_called()

    @pytest.mark.asyncio
    @patch(PREFLIGHT_EMAIL_CHECK_IMPORT_PATH)
    @patch(ENROLL_VALIDATE_EMAIL_MFA_IMPORT_PATH)
    @patch(DELETE_OLD_EMAIL_MFA_IMPORT_PATH)
    @patch(BUILD_EMAIL_MFA_SYNC_CONTEXT_IMPORT_PATH)
    @patch(UPDATE_SESSION_IMPORT_PATH)
    @patch(UPDATE_PROFILE_IMPORT_PATH)
    @patch(GET_PROFILE_FROM_IBM_IMPORT_PATH)
    @patch(VERIFY_OTP_IMPORT_PATH)
    async def test_successful_email_update_with_session_update(
        self,
        mock_verify_otp,
        mock_get_profile,
        mock_update_profile,
        mock_update_session,
        mock_build_email_sync_context,
        mock_delete_old_email_mfa,
        mock_enroll_validate_email_mfa,
        mock_preflight_email_check,
    ):
        """Test successful profile update with email address change and session update"""
        # Arrange
        mock_verify_otp.return_value = None
        mock_preflight_email_check.return_value = False

        current_profile = IBMVerifyUserProfileSchema(
            id="user-123",
            userName="old@example.com",
            emails=[EmailItem(value="old@example.com", type="work")],
            active=True,
            meta={
                "location": "https://example.com/users/user-123",
                "created": "2023-01-01T00:00:00Z",
                "lastModified": "2023-09-22T12:30:00Z",
                "resourceType": "User",
            },
        )
        mock_get_profile.return_value = current_profile

        updated_profile = IBMVerifyUserProfileSchema(
            id="user-123",
            userName="new@example.com",
            emails=[EmailItem(value="new@example.com", type="work")],
            active=True,
            meta={
                "location": "https://example.com/users/user-123",
                "created": "2023-01-01T00:00:00Z",
                "lastModified": "2023-09-22T12:30:00Z",
                "resourceType": "User",
            },
        )
        mock_update_response = Mock(success=True, data=updated_profile)
        mock_update_profile.return_value = mock_update_response
        mock_build_email_sync_context.return_value = EmailMfaSyncContext(
            normalized_old_email="old@example.com",
            normalized_new_email="new@example.com",
            old_email_factor_ids=["old-factor-1"],
            has_new_email_factor=False,
        )

        call_sequence = []

        async def track_delete_old(*args, **kwargs):
            call_sequence.append("delete_old_email_mfa")

        async def track_profile_update(*args, **kwargs):
            call_sequence.append("update_profile")
            return mock_update_response

        async def track_enroll_validate(*args, **kwargs):
            call_sequence.append("enroll_and_validate_new_email_mfa")

        mock_delete_old_email_mfa.side_effect = track_delete_old
        mock_update_profile.side_effect = track_profile_update
        mock_enroll_validate_email_mfa.side_effect = track_enroll_validate

        mock_request = Mock()
        mock_request.app = Mock()
        mock_request.app.state = Mock()
        mock_request.app.state.request_client = Mock(spec=AsyncClient)

        profile_update_data = ProfileUpdateWithOtpRequest(
            otp="123456",
            trxnId="test-trxn-id",
            otpType=OtpType.SMS,
            newEmailAddress="new@example.com",
        )

        # Act
        response = await update_profile_with_otp_verification(
            mock_request, profile_update_data, "user-token"
        )

        # Assert
        assert response.success is True
        assert response.message == "Profile updated successfully after OTP verification"
        assert response.data == updated_profile

        mock_verify_otp.assert_called_once_with(
            global_http_client=mock_request.app.state.request_client,
            otp="123456",
            trxn_id="test-trxn-id",
            otp_type=OtpType.SMS,
            user_access_token="user-token",
        )
        mock_get_profile.assert_called_once()
        mock_update_profile.assert_called_once()
        mock_build_email_sync_context.assert_called_once()
        mock_delete_old_email_mfa.assert_called_once()
        mock_enroll_validate_email_mfa.assert_called_once()
        assert call_sequence == [
            "delete_old_email_mfa",
            "update_profile",
            "enroll_and_validate_new_email_mfa",
        ]

        # Verify session was updated with new email
        mock_update_session.assert_called_once()
        session_updates = mock_update_session.call_args[0][1]
        assert session_updates["preferred_username"] == "new@example.com"
        assert session_updates["email"] == "new@example.com"

    @pytest.mark.asyncio
    @patch(PREFLIGHT_EMAIL_CHECK_IMPORT_PATH)
    @patch(ENROLL_VALIDATE_EMAIL_MFA_IMPORT_PATH)
    @patch(DELETE_OLD_EMAIL_MFA_IMPORT_PATH)
    @patch(BUILD_EMAIL_MFA_SYNC_CONTEXT_IMPORT_PATH)
    @patch(UPDATE_PROFILE_IMPORT_PATH)
    @patch(GET_PROFILE_FROM_IBM_IMPORT_PATH)
    @patch(VERIFY_OTP_IMPORT_PATH)
    async def test_duplicate_email_preflight_prevents_delete_and_update(
        self,
        mock_verify_otp,
        mock_get_profile,
        mock_update_profile,
        mock_build_email_sync_context,
        mock_delete_old_email_mfa,
        mock_enroll_validate_email_mfa,
        mock_preflight_email_check,
    ):
        """Duplicate email preflight should fail before deletion/update operations."""
        mock_verify_otp.return_value = None
        mock_preflight_email_check.return_value = True

        current_profile = IBMVerifyUserProfileSchema(
            id="user-123",
            userName="old@example.com",
            emails=[EmailItem(value="old@example.com", type="work")],
            active=True,
            meta={
                "location": "https://example.com/users/user-123",
                "created": "2023-01-01T00:00:00Z",
                "lastModified": "2023-09-22T12:30:00Z",
                "resourceType": "User",
            },
        )
        mock_get_profile.return_value = current_profile
        mock_build_email_sync_context.return_value = EmailMfaSyncContext(
            normalized_old_email="old@example.com",
            normalized_new_email="new@example.com",
            old_email_factor_ids=["old-factor-1"],
            has_new_email_factor=False,
        )

        mock_request = Mock()
        mock_request.app = Mock()
        mock_request.app.state = Mock()
        mock_request.app.state.request_client = Mock(spec=AsyncClient)

        profile_update_data = ProfileUpdateWithOtpRequest(
            otp="123456",
            trxnId="test-trxn-id",
            otpType=OtpType.SMS,
            newEmailAddress="new@example.com",
        )

        with pytest.raises(HTTPException) as exc:
            await update_profile_with_otp_verification(
                mock_request, profile_update_data, "user-token"
            )

        assert exc.value.status_code == 400
        assert exc.value.detail == "email_already_associated"
        mock_delete_old_email_mfa.assert_not_called()
        mock_update_profile.assert_not_called()
        mock_enroll_validate_email_mfa.assert_not_called()

    @pytest.mark.asyncio
    @patch(ENROLL_VALIDATE_EMAIL_MFA_IMPORT_PATH)
    @patch(DELETE_OLD_EMAIL_MFA_IMPORT_PATH)
    @patch(BUILD_EMAIL_MFA_SYNC_CONTEXT_IMPORT_PATH)
    @patch(UPDATE_SESSION_IMPORT_PATH)
    @patch(UPDATE_PROFILE_IMPORT_PATH)
    @patch(GET_PROFILE_FROM_IBM_IMPORT_PATH)
    @patch(VERIFY_OTP_IMPORT_PATH)
    async def test_successful_phone_update_no_session_update(
        self,
        mock_verify_otp,
        mock_get_profile,
        mock_update_profile,
        mock_update_session,
        mock_build_email_sync_context,
        mock_delete_old_email_mfa,
        mock_enroll_validate_email_mfa,
    ):
        """Test successful profile update with phone number change (no session update)"""
        # Arrange
        mock_verify_otp.return_value = None

        current_profile = IBMVerifyUserProfileSchema(
            id="user-123",
            userName="user@example.com",
            emails=[EmailItem(value="user@example.com", type="work")],
            phoneNumbers=[],
            active=True,
            meta={
                "location": "https://example.com/users/user-123",
                "created": "2023-01-01T00:00:00Z",
                "lastModified": "2023-09-22T12:30:00Z",
                "resourceType": "User",
            },
        )
        mock_get_profile.return_value = current_profile

        updated_profile = IBMVerifyUserProfileSchema(
            id="user-123",
            userName="user@example.com",
            emails=[EmailItem(value="user@example.com", type="work")],
            phoneNumbers=[MetaDataTypeValue(value="+15551234567", type="mobile")],
            active=True,
            meta={
                "location": "https://example.com/users/user-123",
                "created": "2023-01-01T00:00:00Z",
                "lastModified": "2023-09-22T12:30:00Z",
                "resourceType": "User",
            },
        )
        mock_update_response = Mock(success=True, data=updated_profile)
        mock_update_profile.return_value = mock_update_response

        mock_request = Mock()
        mock_request.app = Mock()
        mock_request.app.state = Mock()
        mock_request.app.state.request_client = Mock(spec=AsyncClient)

        profile_update_data = ProfileUpdateWithOtpRequest(
            otp="123456",
            trxnId="test-trxn-id",
            otpType=OtpType.SMS,
            phoneNumbers=[MetaDataTypeValue(value="+15551234567", type="mobile")],
        )

        # Act
        response = await update_profile_with_otp_verification(
            mock_request, profile_update_data, "user-token"
        )

        # Assert
        assert response.success is True
        assert response.data.phoneNumbers[0].value == "+15551234567"

        # Session should not be updated for phone changes
        mock_update_session.assert_not_called()
        mock_build_email_sync_context.assert_not_called()
        mock_delete_old_email_mfa.assert_not_called()
        mock_enroll_validate_email_mfa.assert_not_called()

    @pytest.mark.asyncio
    @patch(GET_PROFILE_FROM_IBM_IMPORT_PATH)
    @patch(VERIFY_OTP_IMPORT_PATH)
    async def test_otp_verification_failure_prevents_update(
        self, mock_verify_otp, mock_get_profile
    ):
        """Test that OTP verification failure prevents profile update"""
        # Arrange
        mock_verify_otp.side_effect = HTTPException(
            status_code=400, detail="Invalid OTP code"
        )

        mock_request = Mock()
        mock_request.app = Mock()
        mock_request.app.state = Mock()
        mock_request.app.state.request_client = Mock(spec=AsyncClient)

        profile_update_data = ProfileUpdateWithOtpRequest(
            otp="wrong-code",
            trxnId="test-trxn-id",
            otpType=OtpType.SMS,
            newEmailAddress="new@example.com",
        )

        # Act & Assert
        with pytest.raises(HTTPException) as exc:
            await update_profile_with_otp_verification(
                mock_request, profile_update_data, "user-token"
            )

        assert exc.value.status_code == 400
        assert exc.value.detail == "Invalid OTP code"

        # Verify profile retrieval and update were never called
        mock_get_profile.assert_not_called()

    @pytest.mark.asyncio
    @patch(GET_PROFILE_FROM_IBM_IMPORT_PATH)
    @patch(VERIFY_OTP_IMPORT_PATH)
    async def test_missing_username_raises_error(
        self, mock_verify_otp, mock_get_profile
    ):
        """Test handling of missing user profile userName"""
        # Arrange
        mock_verify_otp.return_value = None

        current_profile = Mock()
        current_profile.userName = None
        current_profile.id = "user-123"
        mock_get_profile.return_value = current_profile

        mock_request = Mock()
        mock_request.app = Mock()
        mock_request.app.state = Mock()
        mock_request.app.state.request_client = Mock(spec=AsyncClient)

        profile_update_data = ProfileUpdateWithOtpRequest(
            otp="123456",
            trxnId="test-trxn-id",
            otpType=OtpType.EMAIL,
            newEmailAddress="new@example.com",
        )

        # Act & Assert
        with pytest.raises(HTTPException) as exc:
            await update_profile_with_otp_verification(
                mock_request, profile_update_data, "user-token"
            )

        assert exc.value.status_code == 500
        assert "Unable to retrieve current user profile" in exc.value.detail

    @pytest.mark.asyncio
    @patch(PREFLIGHT_EMAIL_CHECK_IMPORT_PATH)
    @patch(RESTORE_OLD_EMAIL_MFA_IMPORT_PATH)
    @patch(DELETE_OLD_EMAIL_MFA_IMPORT_PATH)
    @patch(BUILD_EMAIL_MFA_SYNC_CONTEXT_IMPORT_PATH)
    @patch(UPDATE_PROFILE_IMPORT_PATH)
    @patch(GET_PROFILE_FROM_IBM_IMPORT_PATH)
    @patch(VERIFY_OTP_IMPORT_PATH)
    async def test_profile_update_failure_raises_error(
        self,
        mock_verify_otp,
        mock_get_profile,
        mock_update_profile,
        mock_build_email_sync_context,
        mock_delete_old_email_mfa,
        mock_restore_old_email_mfa,
        mock_preflight_email_check,
    ):
        """Test handling of profile update failure after successful OTP verification"""
        # Arrange
        mock_verify_otp.return_value = None
        mock_preflight_email_check.return_value = False

        current_profile = IBMVerifyUserProfileSchema(
            id="user-123",
            userName="user@example.com",
            emails=[EmailItem(value="user@example.com", type="work")],
            active=True,
            meta={
                "location": "https://example.com/users/user-123",
                "created": "2023-01-01T00:00:00Z",
                "lastModified": "2023-09-22T12:30:00Z",
                "resourceType": "User",
            },
        )
        mock_get_profile.return_value = current_profile

        # Mock failed update
        mock_update_response = Mock(success=False)
        mock_update_profile.return_value = mock_update_response
        mock_build_email_sync_context.return_value = EmailMfaSyncContext(
            normalized_old_email="user@example.com",
            normalized_new_email="new@example.com",
            old_email_factor_ids=["old-factor-1"],
            has_new_email_factor=False,
        )

        mock_request = Mock()
        mock_request.app = Mock()
        mock_request.app.state = Mock()
        mock_request.app.state.request_client = Mock(spec=AsyncClient)

        profile_update_data = ProfileUpdateWithOtpRequest(
            otp="123456",
            trxnId="test-trxn-id",
            otpType=OtpType.VOICE,
            newEmailAddress="new@example.com",
        )

        # Act & Assert
        with pytest.raises(HTTPException) as exc:
            await update_profile_with_otp_verification(
                mock_request, profile_update_data, "user-token"
            )

        assert exc.value.status_code == 500
        assert "Profile update failed after OTP verification" in exc.value.detail
        mock_delete_old_email_mfa.assert_called_once()
        mock_restore_old_email_mfa.assert_called_once()

    @pytest.mark.asyncio
    @patch(PREFLIGHT_EMAIL_CHECK_IMPORT_PATH)
    @patch(RESTORE_OLD_EMAIL_MFA_IMPORT_PATH)
    @patch(ENROLL_VALIDATE_EMAIL_MFA_IMPORT_PATH)
    @patch(DELETE_OLD_EMAIL_MFA_IMPORT_PATH)
    @patch(BUILD_EMAIL_MFA_SYNC_CONTEXT_IMPORT_PATH)
    @patch(UPDATE_PROFILE_IMPORT_PATH)
    @patch(GET_PROFILE_FROM_IBM_IMPORT_PATH)
    @patch(VERIFY_OTP_IMPORT_PATH)
    async def test_profile_update_http_409_conflict_preserves_old_email_factor(
        self,
        mock_verify_otp,
        mock_get_profile,
        mock_update_profile,
        mock_build_email_sync_context,
        mock_delete_old_email_mfa,
        mock_enroll_validate_email_mfa,
        mock_restore_old_email_mfa,
        mock_preflight_email_check,
    ):
        """A profile update conflict should trigger old email MFA restoration."""
        mock_verify_otp.return_value = None
        mock_preflight_email_check.return_value = False

        current_profile = IBMVerifyUserProfileSchema(
            id="user-123",
            userName="user@example.com",
            emails=[EmailItem(value="user@example.com", type="work")],
            active=True,
            meta={
                "location": "https://example.com/users/user-123",
                "created": "2023-01-01T00:00:00Z",
                "lastModified": "2023-09-22T12:30:00Z",
                "resourceType": "User",
            },
        )
        mock_get_profile.return_value = current_profile

        mock_build_email_sync_context.return_value = EmailMfaSyncContext(
            normalized_old_email="user@example.com",
            normalized_new_email="new@example.com",
            old_email_factor_ids=["old-factor-1"],
            has_new_email_factor=False,
        )

        conflict_response = Response(
            status_code=409,
            request=Request("PUT", "https://example.com/v2.0/Me"),
            json={"messageId": "SOME_CONFLICT"},
        )
        mock_update_profile.side_effect = HTTPStatusError(
            "Conflict",
            request=conflict_response.request,
            response=conflict_response,
        )

        mock_request = Mock()
        mock_request.app = Mock()
        mock_request.app.state = Mock()
        mock_request.app.state.request_client = Mock(spec=AsyncClient)

        profile_update_data = ProfileUpdateWithOtpRequest(
            otp="123456",
            trxnId="test-trxn-id",
            otpType=OtpType.VOICE,
            newEmailAddress="new@example.com",
        )

        with pytest.raises(HTTPStatusError) as exc:
            await update_profile_with_otp_verification(
                mock_request, profile_update_data, "user-token"
            )

        assert exc.value.response.status_code == 409
        mock_delete_old_email_mfa.assert_called_once()
        mock_restore_old_email_mfa.assert_called_once()
        mock_enroll_validate_email_mfa.assert_not_called()

    @pytest.mark.asyncio
    @patch(PREFLIGHT_EMAIL_CHECK_IMPORT_PATH)
    @patch(ENROLL_VALIDATE_EMAIL_MFA_IMPORT_PATH)
    @patch(DELETE_OLD_EMAIL_MFA_IMPORT_PATH)
    @patch(BUILD_EMAIL_MFA_SYNC_CONTEXT_IMPORT_PATH)
    @patch(UPDATE_SESSION_IMPORT_PATH)
    @patch(UPDATE_PROFILE_IMPORT_PATH)
    @patch(GET_PROFILE_FROM_IBM_IMPORT_PATH)
    @patch(VERIFY_OTP_IMPORT_PATH)
    async def test_session_update_failure_does_not_fail_operation(
        self,
        mock_verify_otp,
        mock_get_profile,
        mock_update_profile,
        mock_update_session,
        mock_build_email_sync_context,
        mock_delete_old_email_mfa,
        mock_enroll_validate_email_mfa,
        mock_preflight_email_check,
    ):
        """Test that session update failure doesn't fail the entire operation"""
        # Arrange
        mock_verify_otp.return_value = None
        mock_preflight_email_check.return_value = False

        current_profile = IBMVerifyUserProfileSchema(
            id="user-123",
            userName="old@example.com",
            emails=[EmailItem(value="old@example.com", type="work")],
            active=True,
            meta={
                "location": "https://example.com/users/user-123",
                "created": "2023-01-01T00:00:00Z",
                "lastModified": "2023-09-22T12:30:00Z",
                "resourceType": "User",
            },
        )
        mock_get_profile.return_value = current_profile

        updated_profile = IBMVerifyUserProfileSchema(
            id="user-123",
            userName="new@example.com",
            emails=[EmailItem(value="new@example.com", type="work")],
            active=True,
            meta={
                "location": "https://example.com/users/user-123",
                "created": "2023-01-01T00:00:00Z",
                "lastModified": "2023-09-22T12:30:00Z",
                "resourceType": "User",
            },
        )
        mock_update_response = Mock(success=True, data=updated_profile)
        mock_update_profile.return_value = mock_update_response
        mock_build_email_sync_context.return_value = EmailMfaSyncContext(
            normalized_old_email="old@example.com",
            normalized_new_email="new@example.com",
            old_email_factor_ids=["old-factor-1"],
            has_new_email_factor=False,
        )

        # Session update fails
        mock_update_session.side_effect = Exception("Session update failed")

        mock_request = Mock()
        mock_request.app = Mock()
        mock_request.app.state = Mock()
        mock_request.app.state.request_client = Mock(spec=AsyncClient)

        profile_update_data = ProfileUpdateWithOtpRequest(
            otp="123456",
            trxnId="test-trxn-id",
            otpType=OtpType.SMS,
            newEmailAddress="new@example.com",
        )

        # Act - should not raise exception despite session update failure
        response = await update_profile_with_otp_verification(
            mock_request, profile_update_data, "user-token"
        )

        # Assert - operation still succeeds
        assert response.success is True
        assert response.data == updated_profile
        mock_delete_old_email_mfa.assert_called_once()
        mock_enroll_validate_email_mfa.assert_called_once()


class TestGetUpdateFieldNames:
    """Test the _get_update_field_names helper function"""

    def test_email_update_returns_email_field(self):
        """Test that email update returns 'email' in field names"""
        update_data = ProfileUpdateWithOtpRequest(
            otp="123456",
            trxnId="test-trxn-id",
            otpType=OtpType.SMS,
            newEmailAddress="new@example.com",
        )

        result = _get_update_field_names(update_data)

        assert "email" in result
        assert len(result) == 1

    def test_phone_update_returns_phone_field(self):
        """Test that phone update returns 'phoneNumbers' in field names"""
        update_data = ProfileUpdateWithOtpRequest(
            otp="123456",
            trxnId="test-trxn-id",
            otpType=OtpType.SMS,
            phoneNumbers=[MetaDataTypeValue(value="+15551234567", type="mobile")],
        )

        result = _get_update_field_names(update_data)

        assert "phoneNumbers" in result
        assert len(result) == 1

    def test_multiple_fields_returns_all_fields(self):
        """Test that multiple field updates returns all field names"""
        update_data = ProfileUpdateWithOtpRequest(
            otp="123456",
            trxnId="test-trxn-id",
            otpType=OtpType.EMAIL,
            newEmailAddress="new@example.com",
            phoneNumbers=[MetaDataTypeValue(value="+15551234567", type="mobile")],
        )

        result = _get_update_field_names(update_data)

        assert "email" in result
        assert "phoneNumbers" in result
        assert len(result) == 2


class TestBuildSessionUpdates:
    """Test the _build_session_updates helper function"""

    def test_email_change_creates_session_updates(self):
        """Test that email change creates session updates"""
        update_data = ProfileUpdateWithOtpRequest(
            otp="123456",
            trxnId="test-trxn-id",
            otpType=OtpType.SMS,
            newEmailAddress="new@example.com",
        )

        result = _build_session_updates(update_data)

        assert result["preferred_username"] == "new@example.com"
        assert result["email"] == "new@example.com"
        assert len(result) == 2

    def test_phone_only_change_returns_empty_dict(self):
        """Test that phone-only change returns empty session updates"""
        update_data = ProfileUpdateWithOtpRequest(
            otp="123456",
            trxnId="test-trxn-id",
            otpType=OtpType.SMS,
            phoneNumbers=[MetaDataTypeValue(value="+15551234567", type="mobile")],
        )

        result = _build_session_updates(update_data)

        assert len(result) == 0
        assert result == {}


class TestBuildEmailMfaSyncContext:
    @pytest.mark.asyncio
    @patch("app.users.services.update_profile_with_otp.get_user_otp_factors")
    async def test_builds_context_with_old_factor_ids_and_new_factor_flag(
        self,
        mock_get_user_otp_factors,
    ):
        request = Mock()
        request.app = Mock()
        request.app.state = Mock()
        request.app.state.request_client = Mock(spec=AsyncClient)

        mock_get_user_otp_factors.return_value = Mock(
            success=True,
            data=[
                Mock(id="old-factor-1", type="emailotp", destination="old@example.com"),
                Mock(id="old-factor-2", type="emailotp", destination="OLD@example.com"),
                Mock(id="new-factor", type="emailotp", destination="new@example.com"),
                Mock(id="sms-factor", type="smsotp", destination="+15145550199"),
            ],
        )

        result = await _build_email_mfa_sync_context(
            request=request,
            user_access_token="user-token",
            old_email="old@example.com",
            new_email="new@example.com",
        )

        assert result is not None
        assert result.normalized_new_email == "new@example.com"
        assert result.has_new_email_factor is True
        assert set(result.old_email_factor_ids) == {"old-factor-1", "old-factor-2"}

    @pytest.mark.asyncio
    @patch("app.users.services.update_profile_with_otp.get_user_otp_factors")
    async def test_returns_none_when_email_is_unchanged(
        self, mock_get_user_otp_factors
    ):
        request = Mock()
        request.app = Mock()
        request.app.state = Mock()
        request.app.state.request_client = Mock(spec=AsyncClient)

        result = await _build_email_mfa_sync_context(
            request=request,
            user_access_token="user-token",
            old_email="Old@Example.com",
            new_email="old@example.com",
        )

        assert result is None
        mock_get_user_otp_factors.assert_not_called()

    @pytest.mark.asyncio
    @patch("app.users.services.update_profile_with_otp.get_user_otp_factors")
    async def test_raises_when_factor_lookup_fails(self, mock_get_user_otp_factors):
        request = Mock()
        request.app = Mock()
        request.app.state = Mock()
        request.app.state.request_client = Mock(spec=AsyncClient)

        mock_get_user_otp_factors.return_value = Mock(success=False, data=[])

        with pytest.raises(HTTPException) as exc:
            await _build_email_mfa_sync_context(
                request=request,
                user_access_token="user-token",
                old_email="old@example.com",
                new_email="new@example.com",
            )

        assert exc.value.status_code == 502
        assert exc.value.detail == "Unable to retrieve user MFA factors"


class TestDeleteOldEmailMfaFactors:
    @pytest.mark.asyncio
    @patch("app.users.services.update_profile_with_otp.dispatch_otp_deletion")
    async def test_dispatches_deletions_with_theme_and_language(
        self,
        mock_dispatch_otp_deletion,
    ):
        request = Mock()
        request.app = Mock()
        request.app.state = Mock()
        request.app.state.request_client = Mock(spec=AsyncClient)

        await _delete_old_email_mfa_factors(
            request=request,
            user_access_token="user-token",
            factor_ids=["old-factor-1", "old-factor-2"],
            preferred_language="fr",
            theme_id="57eee205-04f6-463b-b9a6-32ae84aa8943",
        )

        assert mock_dispatch_otp_deletion.await_count == 2
        for call in mock_dispatch_otp_deletion.await_args_list:
            assert call.kwargs["deletion_request"].otpType == OtpType.EMAIL
            assert call.kwargs["user_access_token"] == "user-token"
            assert call.kwargs["language"] == "fr"
            assert call.kwargs["theme_id"] == "57eee205-04f6-463b-b9a6-32ae84aa8943"


class TestEnrollAndValidateNewEmailMfaFactor:
    @pytest.mark.asyncio
    @patch(
        "app.users.services.update_profile_with_otp.get_admin_token",
        new_callable=AsyncMock,
    )
    @patch("app.users.services.update_profile_with_otp.dispatch_otp_factor_validation")
    @patch("app.users.services.update_profile_with_otp.dispatch_otp_enrollment")
    async def test_enrolls_and_validates_new_email_mfa_factor(
        self,
        mock_dispatch_otp_enrollment,
        mock_dispatch_otp_factor_validation,
        mock_get_admin_token,
    ):
        request = Mock()
        request.app = Mock()
        request.app.state = Mock()
        request.app.state.request_client = Mock(spec=AsyncClient)
        mock_get_admin_token.return_value = "admin-token"

        mock_enrollment_response = Mock()
        mock_enrollment_response.json.return_value = {
            "id": "new-factor-123",
            "userId": "user-123",
            "type": "emailotp",
            "emailAddress": "new@example.com",
            "enabled": True,
            "validated": False,
        }
        mock_dispatch_otp_enrollment.return_value = mock_enrollment_response

        await _enroll_and_validate_new_email_mfa_factor(
            request=request,
            user_access_token="user-token",
            user_id="user-123",
            new_email="new@example.com",
            has_new_email_factor=False,
            preferred_language="en",
            theme_id="57eee205-04f6-463b-b9a6-32ae84aa8943",
        )

        mock_dispatch_otp_enrollment.assert_awaited_once()
        mock_dispatch_otp_factor_validation.assert_awaited_once()
        validation_call = mock_dispatch_otp_factor_validation.await_args.kwargs
        assert validation_call["factor_id"] == "new-factor-123"
        assert validation_call["otp_type"] == OtpType.EMAIL
        assert validation_call["factor_payload"] == {
            "id": "new-factor-123",
            "userId": "user-123",
            "type": "emailotp",
            "emailAddress": "new@example.com",
            "enabled": True,
            "validated": True,
        }
        assert validation_call["user_access_token"] == "admin-token"
        assert "theme_id" not in validation_call

    @pytest.mark.asyncio
    @patch(
        "app.users.services.update_profile_with_otp.get_admin_token",
        new_callable=AsyncMock,
    )
    @patch("app.users.services.update_profile_with_otp.dispatch_otp_factor_validation")
    @patch("app.users.services.update_profile_with_otp.dispatch_otp_enrollment")
    async def test_validation_request_reuses_enrollment_payload(
        self,
        mock_dispatch_otp_enrollment,
        mock_dispatch_otp_factor_validation,
        mock_get_admin_token,
    ):
        request = Mock()
        request.app = Mock()
        request.app.state = Mock()
        request.app.state.request_client = Mock(spec=AsyncClient)
        mock_get_admin_token.return_value = "admin-token"

        mock_enrollment_response = Mock()
        mock_enrollment_response.json.return_value = {
            "id": "new-factor-123",
            "validated": False,
        }
        mock_dispatch_otp_enrollment.return_value = mock_enrollment_response

        await _enroll_and_validate_new_email_mfa_factor(
            request=request,
            user_access_token="user-token",
            user_id="user-123",
            new_email="new@example.com",
            has_new_email_factor=False,
            preferred_language="en",
            theme_id=None,
        )

        validation_call = mock_dispatch_otp_factor_validation.await_args.kwargs
        assert validation_call["factor_payload"] == {
            "id": "new-factor-123",
            "validated": True,
        }
        assert validation_call["user_access_token"] == "admin-token"

    @pytest.mark.asyncio
    @patch(
        "app.users.services.update_profile_with_otp.get_admin_token",
        new_callable=AsyncMock,
    )
    @patch("app.users.services.update_profile_with_otp.dispatch_otp_factor_validation")
    @patch("app.users.services.update_profile_with_otp.dispatch_otp_enrollment")
    async def test_409_from_validation_is_propagated_for_global_handler(
        self,
        mock_dispatch_otp_enrollment,
        mock_dispatch_otp_factor_validation,
        mock_get_admin_token,
    ):
        request = Mock()
        request.app = Mock()
        request.app.state = Mock()
        request.app.state.request_client = Mock(spec=AsyncClient)
        mock_get_admin_token.return_value = "admin-token"

        mock_enrollment_response = Mock()
        mock_enrollment_response.json.return_value = {
            "id": "new-factor-123",
            "userId": "user-123",
            "type": "emailotp",
            "emailAddress": "new@example.com",
            "enabled": True,
            "validated": False,
        }
        mock_dispatch_otp_enrollment.return_value = mock_enrollment_response

        conflict_response = Response(
            status_code=409,
            request=Request(
                "PUT", "https://example.com/v2.0/factors/emailotp/new-factor-123"
            ),
            json={"messageId": "SOME_CONFLICT"},
        )
        mock_dispatch_otp_factor_validation.side_effect = HTTPStatusError(
            "Conflict",
            request=conflict_response.request,
            response=conflict_response,
        )

        with pytest.raises(HTTPStatusError) as exc:
            await _enroll_and_validate_new_email_mfa_factor(
                request=request,
                user_access_token="user-token",
                user_id="user-123",
                new_email="new@example.com",
                has_new_email_factor=False,
                preferred_language="en",
                theme_id=None,
            )

        assert exc.value.response.status_code == 409

    @pytest.mark.asyncio
    @patch(
        "app.users.services.update_profile_with_otp.get_admin_token",
        new_callable=AsyncMock,
    )
    @patch("app.users.services.update_profile_with_otp.dispatch_otp_factor_validation")
    @patch("app.users.services.update_profile_with_otp.dispatch_otp_enrollment")
    async def test_400_from_validation_is_propagated_for_global_handler(
        self,
        mock_dispatch_otp_enrollment,
        mock_dispatch_otp_factor_validation,
        mock_get_admin_token,
    ):
        request = Mock()
        request.app = Mock()
        request.app.state = Mock()
        request.app.state.request_client = Mock(spec=AsyncClient)
        mock_get_admin_token.return_value = "admin-token"

        mock_enrollment_response = Mock()
        mock_enrollment_response.json.return_value = {
            "id": "new-factor-123",
            "userId": "user-123",
            "type": "emailotp",
            "emailAddress": "new@example.com",
            "enabled": True,
            "validated": False,
        }
        mock_dispatch_otp_enrollment.return_value = mock_enrollment_response

        bad_request_response = Response(
            status_code=400,
            request=Request(
                "PUT", "https://example.com/v2.0/factors/emailotp/new-factor-123"
            ),
            json={"messageId": "CSIBN0005E"},
        )
        mock_dispatch_otp_factor_validation.side_effect = HTTPStatusError(
            "Bad Request",
            request=bad_request_response.request,
            response=bad_request_response,
        )

        with pytest.raises(HTTPStatusError) as exc:
            await _enroll_and_validate_new_email_mfa_factor(
                request=request,
                user_access_token="user-token",
                user_id="user-123",
                new_email="new@example.com",
                has_new_email_factor=False,
                preferred_language="en",
                theme_id=None,
            )

        assert exc.value.response.status_code == 400

    @pytest.mark.asyncio
    @patch("app.users.services.update_profile_with_otp.dispatch_otp_factor_validation")
    @patch("app.users.services.update_profile_with_otp.dispatch_otp_enrollment")
    async def test_skips_when_new_email_factor_exists(
        self,
        mock_dispatch_otp_enrollment,
        mock_dispatch_otp_factor_validation,
    ):
        request = Mock()
        request.app = Mock()
        request.app.state = Mock()
        request.app.state.request_client = Mock(spec=AsyncClient)

        await _enroll_and_validate_new_email_mfa_factor(
            request=request,
            user_access_token="user-token",
            user_id="user-123",
            new_email="new@example.com",
            has_new_email_factor=True,
            preferred_language="en",
            theme_id=None,
        )

        mock_dispatch_otp_enrollment.assert_not_awaited()
        mock_dispatch_otp_factor_validation.assert_not_awaited()

    @pytest.mark.asyncio
    @patch("app.users.services.update_profile_with_otp.dispatch_otp_factor_validation")
    @patch("app.users.services.update_profile_with_otp.dispatch_otp_enrollment")
    async def test_propagates_when_enrollment_response_has_no_factor_id(
        self,
        mock_dispatch_otp_enrollment,
        mock_dispatch_otp_factor_validation,
    ):
        request = Mock()
        request.app = Mock()
        request.app.state = Mock()
        request.app.state.request_client = Mock(spec=AsyncClient)

        mock_enrollment_response = Mock()
        mock_enrollment_response.json.return_value = {"validated": False}
        mock_dispatch_otp_enrollment.return_value = mock_enrollment_response

        with pytest.raises(KeyError) as exc:
            await _enroll_and_validate_new_email_mfa_factor(
                request=request,
                user_access_token="user-token",
                user_id="user-123",
                new_email="new@example.com",
                has_new_email_factor=False,
                preferred_language="en",
                theme_id=None,
            )

        assert str(exc.value) == "'id'"
        mock_dispatch_otp_factor_validation.assert_not_awaited()
