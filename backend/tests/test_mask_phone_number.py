import pytest
from app.utils.mask_phone_number import mask_phone_number


def test_number_with_only_digits():
    phone = "+19876541234"
    result = mask_phone_number(phone)
    assert result.endswith("1234")
    assert result == "(***) *** 1234"


def test_invalid_short_number():
    with pytest.raises(ValueError, match="Phone number must have at least 4 digits"):
        mask_phone_number("123")


def test_valid_international_number():
    phone = "+44 20 8366 1177"
    result = mask_phone_number(phone)
    assert result.endswith("1177")
    assert result == "(***) *** 1177"


def test_valid_ca_number():
    phone = "+1 (613) 123-4567"
    result = mask_phone_number(phone)
    assert result.endswith("4567")
    assert result == "(***) *** 4567"


def test_invalid_input():
    with pytest.raises(ValueError, match="Phone number must have at least 4 digits"):
        mask_phone_number("abcedefg")
