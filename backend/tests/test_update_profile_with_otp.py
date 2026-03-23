import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException
from httpx import AsyncClient

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
    _build_profile_update_request,
    _get_update_field_names,
    _build_session_updates,
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


class TestUpdateProfileWithOtpVerification:
    """Test the main update_profile_with_otp_verification function"""

    @pytest.mark.asyncio
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
    ):
        """Test successful profile update with email address change and session update"""
        # Arrange
        mock_verify_otp.return_value = None

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
            user_access_token="user-token",
            otp="123456",
            trxn_id="test-trxn-id",
            otp_type=OtpType.SMS,
        )
        mock_get_profile.assert_called_once()
        mock_update_profile.assert_called_once()

        # Verify session was updated with new email
        mock_update_session.assert_called_once()
        session_updates = mock_update_session.call_args[0][1]
        assert session_updates["preferred_username"] == "new@example.com"
        assert session_updates["email"] == "new@example.com"

    @pytest.mark.asyncio
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
    @patch(UPDATE_PROFILE_IMPORT_PATH)
    @patch(GET_PROFILE_FROM_IBM_IMPORT_PATH)
    @patch(VERIFY_OTP_IMPORT_PATH)
    async def test_profile_update_failure_raises_error(
        self, mock_verify_otp, mock_get_profile, mock_update_profile
    ):
        """Test handling of profile update failure after successful OTP verification"""
        # Arrange
        mock_verify_otp.return_value = None

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

    @pytest.mark.asyncio
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
    ):
        """Test that session update failure doesn't fail the entire operation"""
        # Arrange
        mock_verify_otp.return_value = None

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
