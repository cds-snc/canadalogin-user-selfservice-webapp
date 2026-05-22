import pytest
from unittest.mock import patch
from app.utils.mask_user_profile import (
    mask_profile_details,
    mask_contact_number,
    mask_profile_email_addresses,
)
from phonenumbers import NumberParseException

MASK_CONTACT_NUMBER_IMPORT = "app.utils.mask_user_profile.mask_contact_number"


@patch(MASK_CONTACT_NUMBER_IMPORT)
def test_mask_profile_details_masks_contact_number(mock_mask_contact):
    """mask_profile_details should call mask_contact_number."""
    profile_data = {
        "userName": "john@example.com",
        "contactNumber": "+16135551234",
    }

    result = mask_profile_details(profile_data)

    # Should mutate the original dict, not return a new one
    assert result is profile_data
    mock_mask_contact.assert_called_once_with(profile_data)


@patch(MASK_CONTACT_NUMBER_IMPORT)
def test_mask_profile_details_handles_missing_contact_number(mock_mask_contact):
    """If contactNumber is missing, mask_contact_number is still called."""
    profile_data = {"userName": "john@example.com"}

    result = mask_profile_details(profile_data)

    assert result is profile_data
    mock_mask_contact.assert_called_once_with(profile_data)


def test_mask_contact_number_valid_phone():
    profile_data = {"contactNumber": "+16135551234"}
    mask_contact_number(profile_data)
    assert profile_data["contactNumber"] == "+1 (***) ***-1234"


def test_mask_contact_number_invalid_phone():
    with pytest.raises(
        NumberParseException,
        match="The string supplied did not seem to be a phone number.",
    ):
        profile_data = {"contactNumber": "abcdef"}
        mask_contact_number(profile_data)


def test_mask_contact_number_none_value():
    """Does nothing when contactNumber is absent."""
    profile_data = {"userName": "john@example.com"}
    mask_contact_number(profile_data)  # should not raise
    assert "contactNumber" not in profile_data


def test_mask_profile_email_addresses_valid_email():
    profile_data = {"emails": [{"value": "test_1-2.3+test@test.com"}]}
    result = mask_profile_email_addresses(profile_data)
    assert result == [{"value": "te****@test.com"}]


def test_mask_profile_email_addresses_invalid_email():
    profile_data = {"emails": [{"value": "test.com"}]}
    result = mask_profile_email_addresses(profile_data)
    assert result == []
