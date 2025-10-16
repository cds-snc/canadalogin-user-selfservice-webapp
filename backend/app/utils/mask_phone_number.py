from app.users.schemas import MetaDataTypeValue


def mask_phone_number(phone_number: str) -> str:
    """
    Mask the phone number except the last 4 digits.
    Returns a masked string like (***) *** 1234.
    """

    # Extract phone number string only
    digits = "".join(filter(str.isdigit, phone_number))
    if len(digits) < 4:
        raise ValueError("Phone number must have at least 4 digits")

    # Mask everything except the last 4
    last4 = digits[-4:]
    masked = f"(***) *** {last4}"

    return masked


def mask_contact_phone_numbers(
    json_data: dict,
) -> list[MetaDataTypeValue]:
    """
    Mask phone numbers in user profile data, showing only the last 4 digits.

    Args:
        json_data: User profile JSON data containing phoneNumbers

    Returns:
        list[MetaDataTypeValue] | None: List of phone number objects with masked values
    """

    profile_contact_phone_numbers = json_data.get("phoneNumbers")

    if profile_contact_phone_numbers is None:
        return None

    masked_phone_numbers = []
    for phone in profile_contact_phone_numbers:
        value = phone.get("value")
        if not value:
            continue
        masked_phone = phone.copy()  # Create a copy of the original phone dict
        masked_phone["value"] = mask_phone_number(value)
        masked_phone_numbers.append(masked_phone)
    return masked_phone_numbers
