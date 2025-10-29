import phonenumbers
from app.users.schemas import MetaDataTypeValue


def mask_phone_number(phone_number: str, region: str = "US") -> str:
    parsed = phonenumbers.parse(phone_number, region)
    country_code = f"+{parsed.country_code}"
    formatted_national = phonenumbers.format_number(
        parsed, phonenumbers.PhoneNumberFormat.NATIONAL
    )
    # Mask all digits except the last 4
    digits = [c for c in formatted_national if c.isdigit()]
    if len(digits) < 4:
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


def mask_contact_phone_numbers(
    json_data: dict,
) -> list[MetaDataTypeValue]:
    """
    Mask phone numbers in user profile data, showing only the last 4 digits.

    Args:
        json_data: User profile JSON data containing phoneNumbers

    Returns:
        list[MetaDataTypeValue]: List of phone number objects with masked values
    """

    profile_contact_phone_numbers = json_data.get("phoneNumbers")

    if profile_contact_phone_numbers is None:
        return []

    masked_phone_numbers = []
    for phone in profile_contact_phone_numbers:
        value = phone.get("value")
        if not value:
            continue
        masked_phone = phone.copy()  # Create a copy of the original phone dict
        masked_phone["value"] = mask_phone_number(value)
        masked_phone_numbers.append(masked_phone)
    return masked_phone_numbers
