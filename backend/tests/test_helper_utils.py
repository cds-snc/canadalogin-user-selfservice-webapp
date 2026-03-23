import json

import pytest
from app.otp.schemas import OtpType
from app.utils.helpers import (
    extract_last_4_digits,
    format_error_response,
    generate_error_response,
    is_masked_phone_number,
    prepare_pydantic_phone_number_for_verify,
    string_error_response,
    verify_otp_before_operation,
)
from app.utils.schemas import ResponseModel
from fastapi import HTTPException
from httpx import AsyncClient
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


# Tests for string_error_response function
def test_string_error_response_with_message_and_description():
    """Test string_error_response with both message and description"""
    result = string_error_response("Error occurred", "Details about the error")
    assert result == "Error occurred - Details about the error"


def test_string_error_response_with_only_message():
    """Test string_error_response with only message (no description)"""
    result = string_error_response("Error occurred")
    assert result == "Error occurred - "


def test_string_error_response_with_only_description():
    """Test string_error_response with only description (no message)"""
    result = string_error_response(description="Details about the error")
    assert result == "Unknown error - Details about the error"


def test_string_error_response_with_no_args():
    """Test string_error_response with no arguments"""
    result = string_error_response()
    assert result == "Unknown error - "


def test_string_error_response_with_empty_strings():
    """Test string_error_response with empty strings"""
    result = string_error_response("", "")
    assert result == "Unknown error - "


# Tests for verify_otp_before_operation function
@pytest.mark.asyncio
async def test_verify_otp_before_operation_success(monkeypatch):
    """Test successful OTP verification"""

    async def mock_handle_otp_verification(
        client, verification_data, user_access_token
    ):
        # Return a successful response
        return ResponseModel(
            success=True, message="OTP verified successfully", data=None
        )

    # Patch the import within the verify_otp_before_operation function
    monkeypatch.setattr(
        "app.otp.services.verify_transient_otp.handle_otp_verification",
        mock_handle_otp_verification,
    )

    async with AsyncClient(base_url="http://localhost") as client:
        # Should not raise any exception
        await verify_otp_before_operation(
            global_http_client=client,
            user_access_token="token123",
            otp="123456",
            trxn_id="txn123",
            otp_type=OtpType.SMS,
        )


@pytest.mark.asyncio
async def test_verify_otp_before_operation_failure(monkeypatch):
    """Test OTP verification failure"""

    async def mock_handle_otp_verification(
        client, verification_data, user_access_token
    ):
        # Return a failed response
        return ResponseModel(success=False, message="Invalid OTP", data=None)

    # Patch the import within the verify_otp_before_operation function
    monkeypatch.setattr(
        "app.otp.services.verify_transient_otp.handle_otp_verification",
        mock_handle_otp_verification,
    )

    async with AsyncClient(base_url="http://localhost") as client:
        with pytest.raises(HTTPException) as exc_info:
            await verify_otp_before_operation(
                global_http_client=client,
                user_access_token="token123",
                otp="wrong_otp",
                trxn_id="txn123",
                otp_type=OtpType.SMS,
            )

        assert exc_info.value.status_code == 400
        assert "OTP verification failed" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_verify_otp_before_operation_http_exception(monkeypatch):
    """Test OTP verification when HTTPException is raised"""

    async def mock_handle_otp_verification(
        client, verification_data, user_access_token
    ):
        # Raise an HTTPException
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Patch the import within the verify_otp_before_operation function
    monkeypatch.setattr(
        "app.otp.services.verify_transient_otp.handle_otp_verification",
        mock_handle_otp_verification,
    )

    async with AsyncClient(base_url="http://localhost") as client:
        with pytest.raises(HTTPException) as exc_info:
            await verify_otp_before_operation(
                global_http_client=client,
                user_access_token="token123",
                otp="123456",
                trxn_id="txn123",
                otp_type=OtpType.VOICE,
            )

        # Should re-raise the original HTTPException
        assert exc_info.value.status_code == 401
        assert "Unauthorized" in str(exc_info.value.detail)
