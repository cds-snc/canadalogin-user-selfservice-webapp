import logging
from typing import Dict, TYPE_CHECKING
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from httpx import AsyncClient

from app.utils.schemas import ResponseModel

# TYPE_CHECKING is True only during static type checking (mypy, IDEs), not at runtime.
# This allows us to import types for annotations without causing circular imports.
# At runtime, these imports are skipped, breaking the circular dependency.
if TYPE_CHECKING:
    from app.otp.schemas import OtpType

logger = logging.getLogger(__name__)


def generate_error_response(status_code: int, message: str):
    return JSONResponse(
        content=ResponseModel(
            success=False,
            message=message,
        ).model_dump(),
        status_code=status_code,
    )


def prepare_pydantic_phone_number_for_verify(phone_number: str):
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


async def verify_otp_before_operation(
    global_http_client: AsyncClient,
    user_access_token: str,
    otp: str,
    trxn_id: str,
    otp_type: "OtpType",
) -> None:
    """
    Verify OTP before performing a sensitive operation.

    This helper function validates an OTP code before allowing operations like
    profile updates, MFA deletion, or other sensitive actions.

    Args:
        global_http_client: HTTP client for making requests
        otp: The OTP code to verify
        trxn_id: Transaction ID from OTP request
        otp_type: OTP type enum (OtpType.SMS, OtpType.VOICE, OtpType.EMAIL)

    Raises:
        HTTPException: 400 if OTP verification fails
        HTTPException: 500 for unexpected errors

    Returns:
        None if verification succeeds
    """
    # Import at runtime to avoid circular dependencies (OtpType is imported above for type checking only)
    from app.otp.schemas import UserOtpVerificationInfo
    from app.otp.services.verify_transient_otp import handle_otp_verification

    # Create verification data
    otp_verification_data = UserOtpVerificationInfo(
        otp=otp, trxnId=trxn_id, otpType=otp_type
    )

    logger.info(f"Attempting OTP verification (type: {otp_type.value})")
    otp_verification_response = await handle_otp_verification(
        global_http_client, otp_verification_data, user_access_token
    )

    if not otp_verification_response.success:
        logger.error("OTP verification failed")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP verification failed.",
        )

    logger.info("OTP verification successful")
