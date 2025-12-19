from unittest.mock import Mock

from app.otp.schemas import OtpType
from app.users.schemas import (
    ProfileUpdateWithOtpRequest,
    UserProfileName,
    EmailItem,
    MetaDataTypeValue,
)
from app.users.services.update_profile_with_otp import _build_profile_update_request


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
