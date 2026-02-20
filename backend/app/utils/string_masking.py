import logging
import phonenumbers
import re

logger = logging.getLogger(__name__)


def mask_email_address(email: str) -> str:
    """
    Masks the given email address, as referenced by the figma design.

    Examples:
        Example@gmail.com -> Ex****@gmail.com
        john.doe@company.org -> jo****@company.org
        a@test.com -> a****@test.com

    Args:
        email: the email address string to be masked

    Returns:
        str: masked email address string

    Raises:
        ValueError: if email format is invalid
    """
    pattern = r"^(?![.])(?!.*[.]{2})[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

    if not email or not bool(re.fullmatch(pattern, email)):
        raise ValueError("Invalid email address.")

    # Split email into local and domain parts
    local_part, domain_part = email.rsplit("@", 1)

    if not local_part or not domain_part:
        raise ValueError("Invalid email format")

    # Mask the local part
    if len(local_part) <= 2:
        # If local part is 2 characters or less, show first char + ****
        masked_local = local_part[0] + "****"
    else:
        # Show first 2 characters + ****
        masked_local = local_part[:2] + "****"

    return f"{masked_local}@{domain_part}"


def mask_phone_number(phone_number: str, region: str = "US") -> str:
    """
    Masks and formats the given phone_number according to the region, showing only the country code and last 4 digits.

    Args:
        phone_number: a phone number string in any format, "+19876541234" or "+1 (613) 123-4567"
        region: the localization of the phone number, used for formatting

    Returns:
        str: masked and formatted phone number string "+1 (***) ***-1234"
    """
    parsed = phonenumbers.parse(phone_number, region)
    country_code = f"+{parsed.country_code}"
    formatted_national = phonenumbers.format_number(
        parsed, phonenumbers.PhoneNumberFormat.NATIONAL
    )
    # Mask all digits except the last 4
    digits = [c for c in formatted_national if c.isdigit()]
    if len(digits) < 4:
        logger.error(
            f"Warning: Skipping invalid phone number '{digits}': less than 4 digits"
        )
        raise ValueError("Phone number must have at least 4 digits")

    last4 = digits[-4:]
    masked = ""
    digit_count = 0
    for c in formatted_national:
        if c.isdigit():
            if digit_count < len(digits) - 4:
                masked += "*"
            else:
                masked += last4[digit_count - (len(digits) - 4)]
            digit_count += 1
        else:
            masked += c
    return f"{country_code} {masked}"
