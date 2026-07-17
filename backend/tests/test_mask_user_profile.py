import pytest
from unittest.mock import patch
from app.utils.mask_user_profile import (
    mask_profile_details,
    mask_contact_phone_numbers,
    mask_profile_email_addresses,
)
from phonenumbers import NumberParseException

MASK_PHONE_IMPORT = "app.utils.mask_user_profile.mask_contact_phone_numbers"


@patch(MASK_PHONE_IMPORT)
def test_mask_profile_details_masks_phone_numbers(mock_masked_phone):
    """replace phoneNumbers with masked values."""
    profile_data = {
        "userName": "john@example.com",
        "phoneNumbers": [
            {"value": "+1-613-555-1234", "type": "mobile"},
            {"value": "+1-613-555-5678", "type": "work"},
        ],
    }

    masked_numbers = [
        {"value": "+1-613-XXX-XX34", "type": "mobile"},
        {"value": "+1-613-XXX-XX78", "type": "work"},
    ]

    mock_masked_phone.return_value = masked_numbers

    result = mask_profile_details(profile_data)

    # Should mutate the original dict, not return a new one
    assert result is profile_data
    assert result["phoneNumbers"] == masked_numbers
    mock_masked_phone.assert_called_once_with(profile_data)


@patch(MASK_PHONE_IMPORT)
def test_mask_profile_details_handles_missing_phone_numbers(mock_masked_phone):
    """If phoneNumbers is missing, it defaults to an empty list."""
    profile_data = {"userName": "john@example.com"}

    mock_masked_phone.return_value = []

    result = mask_profile_details(profile_data)

    assert result["phoneNumbers"] == []
    mock_masked_phone.assert_called_once_with(profile_data)


def test_mask_contact_phone_numbers_valid_phone_number():
    profile_data = {
        "phoneNumbers": [{"value": "+1-613-555-1234", "type": "mobile"}],
    }
    result = mask_contact_phone_numbers(profile_data)
    assert result == [{"value": "+1 (***) ***-1234", "type": "mobile"}]


def test_mask_contact_phone_numbers_invalid_phone_number():
    with pytest.raises(
        NumberParseException,
        match="The string supplied did not seem to be a phone number.",
    ):
        profile_data = {
            "phoneNumbers": [{"value": "abcdef", "type": "mobile"}],
        }
        mask_contact_phone_numbers(profile_data)


def test_mask_profile_email_addresses_valid_email():
    profile_data = {"emails": [{"value": "test_1-2.3+test@test.com"}]}
    result = mask_profile_email_addresses(profile_data)
    assert result == [{"value": "te****@test.com"}]


def test_mask_profile_email_addresses_invalid_email():
    profile_data = {"emails": [{"value": "test.com"}]}
    result = mask_profile_email_addresses(profile_data)
    assert result == []


@patch(MASK_PHONE_IMPORT)
def test_mask_profile_details_keeps_non_email_username(mock_masked_phone):
    """Federated usernames can be non-email identifiers and should be preserved."""
    profile_data = {
        "userName": "811000CWGW",
        "phoneNumbers": [{"value": "+1-613-555-1234", "type": "mobile"}],
    }

    mock_masked_phone.return_value = [{"value": "+1 (***) ***-1234", "type": "mobile"}]

    result = mask_profile_details(profile_data)

    assert result["userName"] == "811000CWGW"
