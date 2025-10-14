from typing import Dict

from app.utils.schemas import ResponseModel
from fastapi.responses import JSONResponse
from pydantic_extra_types.phone_numbers import PhoneNumber


def generate_error_response(status_code: int, message: str):
    return JSONResponse(
        content=ResponseModel(
            success=False,
            message=message,
        ).model_dump(),
        status_code=status_code,
    )


def prepare_pydantic_phone_number_for_verify(phone_number: PhoneNumber):
    # Verify's transient sms and voice endpoints do not accept non-numbers in the input string. This function removes non-numbers
    return "".join(c for c in phone_number if c.isdigit())


def format_error_response(json: Dict):
    message_id = json.get("messageId", "Unknown error")
    message_description = json.get("messageDescription", "Unknown error")
    return f"{message_id} - {message_description}"


def string_error_response(message: str = None, description: str = None) -> str:
    if not message:
        message = "Unknown error"
    if not description:
        description = ""
    return f"{message} - {description}"


def is_masked_phone_number(phone_number: str) -> bool:
    """Check if a phone number is masked (contains asterisks)."""
    return isinstance(phone_number, str) and "*" in phone_number


def extract_last_4_digits(masked_phone: str) -> str:
    """Extract the last 4 digits from a masked phone number like '*** *** 6499'."""
    if not masked_phone:
        return ""
    # Extract only digits and return the last 4
    digits = "".join(filter(str.isdigit, masked_phone))
    return digits[-4:] if len(digits) >= 4 else digits
