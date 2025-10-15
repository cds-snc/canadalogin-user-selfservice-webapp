import json

import pytest
from app.utils.helpers import (
    extract_last_4_digits,
    format_error_response,
    generate_error_response,
    is_masked_phone_number,
    prepare_pydantic_phone_number_for_verify,
)
from pydantic_extra_types.phone_numbers import PhoneNumber
from starlette.responses import JSONResponse


@pytest.fixture
def error_dictionary():
    return {
        "messageId": "CSIBN0028E",
        "messageDescription": "The system cannot process the request because the verification was not found.",
    }


def test_generate_error_response(error_dictionary):
    status_code = 400
    error_response = generate_error_response(
        status_code, format_error_response(error_dictionary)
    )
    body = json.loads(
        error_response.body.decode("utf-8")
    )  # The body is returned as bytes.
    assert isinstance(error_response, JSONResponse)
    assert error_response.status_code == 400
    assert body.get("success") is False
    assert (
        body.get("message")
        == "CSIBN0028E - The system cannot process the request because the verification was not found."
    )


def test_format_error_response(error_dictionary):
    formatted_message = format_error_response(error_dictionary)
    assert (
        formatted_message
        == "CSIBN0028E - The system cannot process the request because the verification was not found."
    )


@pytest.mark.parametrize(
    "sample_phone_number",
    ["+1(902)555-5555", "+1902555-5555", "19025555555", "tel:+1-902-555-5555"],
)
def test_prepare_pydantic_phone_number_for_verify(sample_phone_number):
    verify_formatted_phone_number = prepare_pydantic_phone_number_for_verify(
        PhoneNumber(sample_phone_number)
    )
    assert verify_formatted_phone_number == "19025555555"


# Tests for masked phone number functionality
@pytest.mark.parametrize(
    "phone_number,expected_masked",
    [
        ("*** *** 6499", True),
        ("*-*-*-1234", True),
        ("*** 555 1234", True),
        ("+14165551234", False),
        ("1234567890", False),
        ("(416) 555-1234", False),
        ("", False),
        (None, False),
        ("*", True),
        ("123*456", True),
    ],
)
def test_is_masked_phone_number(phone_number, expected_masked):
    """Test detection of masked phone numbers"""
    result = is_masked_phone_number(phone_number)
    assert result == expected_masked


@pytest.mark.parametrize(
    "phone_number,expected_last4",
    [
        ("*** *** 6499", "6499"),
        ("*** *** 1234", "1234"),
        ("*-*-*-5555", "5555"),
        ("+14165551234", "1234"),
        ("1234567890", "7890"),
        ("(416) 555-1234", "1234"),
        ("123", "123"),  # Less than 4 digits
        ("12", "12"),  # Less than 4 digits
        ("", ""),  # Empty string
        ("no-digits-here", ""),  # No digits
        ("*** *** 99", "99"),  # Only 2 digits
        ("abc123def456ghi", "3456"),  # Mixed characters, last 4 digits
    ],
)
def test_extract_last_4_digits(phone_number, expected_last4):
    """Test extraction of last 4 digits from various phone number formats"""
    result = extract_last_4_digits(phone_number)
    assert result == expected_last4
