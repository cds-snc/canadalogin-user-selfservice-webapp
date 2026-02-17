import pytest
from app.utils.string_masking import (
    mask_phone_number,
    mask_email_address,
)
from phonenumbers import NumberParseException


def test_phone_number_with_only_digits():
    phone = "+19876541234"
    result = mask_phone_number(phone)
    assert result.endswith("1234")
    assert result == "+1 (***) ***-1234"


def test_phone_number_invalid_short():
    with pytest.raises(ValueError, match="Phone number must have at least 4 digits"):
        mask_phone_number("123")


def test_phone_number_valid_international():
    phone = "+44 20 8366 1177"
    result = mask_phone_number(phone)
    assert result.endswith("1177")
    assert result == "+44 *** **** 1177"


def test_phone_number_valid_ca():
    phone = "+1 (613) 123-4567"
    result = mask_phone_number(phone)
    assert result.endswith("4567")
    assert result == "+1 (***) ***-4567"


def test_phone_number_invalid():
    with pytest.raises(
        NumberParseException,
        match="The string supplied did not seem to be a phone number.",
    ):
        mask_phone_number("abcedefg")


def test_valid_email():
    email = "test_1-2.3+test@test.com"
    result = mask_email_address(email)
    assert result == "te****@test.com"


def test_email_missing_at_symbol():
    with pytest.raises(
        ValueError,
        match="Invalid email address",
    ):
        mask_email_address("test.com")


def test_email_missing_domain():
    with pytest.raises(
        ValueError,
        match="Invalid email address",
    ):
        mask_email_address("test@.com")


def test_email_invalid_characters():
    with pytest.raises(
        ValueError,
        match="Invalid email address",
    ):
        mask_email_address("test test@test.com")


def test_email_consecutive_dots():
    with pytest.raises(
        ValueError,
        match="Invalid email address",
    ):
        mask_email_address("test..test@test.com")


def test_email_leading_dot():
    with pytest.raises(
        ValueError,
        match="Invalid email address",
    ):
        mask_email_address(".test@test.com")
