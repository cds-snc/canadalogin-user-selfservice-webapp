import pytest
from unittest.mock import patch
from app.utils.mask_user_profile import (
    mask_phone_number,
    mask_profile_details,
)
from phonenumbers import NumberParseException

MASK_PHONE_IMPORT = "app.utils.mask_user_profile.mask_contact_phone_numbers"


def test_number_with_only_digits():
    phone = "+19876541234"
    result = mask_phone_number(phone)
    assert result.endswith("1234")
    assert result == "+1 (***) ***-1234"


def test_invalid_short_number():
    with pytest.raises(ValueError, match="Phone number must have at least 4 digits"):
        mask_phone_number("123")


def test_valid_international_number():
    phone = "+44 20 8366 1177"
    result = mask_phone_number(phone)
    assert result.endswith("1177")
    assert result == "+44 *** **** 1177"


def test_valid_ca_number():
    phone = "+1 (613) 123-4567"
    result = mask_phone_number(phone)
    assert result.endswith("4567")
    assert result == "+1 (***) ***-4567"


def test_invalid_input():
    with pytest.raises(
        NumberParseException,
        match="The string supplied did not seem to be a phone number.",
    ):
        mask_phone_number("abcedefg")


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

    original_numbers = list(profile_data["phoneNumbers"])
    result = mask_profile_details(profile_data)

    # Should mutate the original dict, not return a new one
    assert result is profile_data
    assert result["phoneNumbers"] == masked_numbers
    mock_masked_phone.assert_called_once_with(original_numbers)


@patch(MASK_PHONE_IMPORT)
def test_mask_profile_details_handles_missing_phone_numbers(mock_masked_phone):
    """If phoneNumbers is missing, it defaults to an empty list."""
    profile_data = {"userName": "john@example.com"}

    mock_masked_phone.return_value = []

    result = mask_profile_details(profile_data)

    assert result["phoneNumbers"] == []
    mock_masked_phone.assert_called_once_with([])
