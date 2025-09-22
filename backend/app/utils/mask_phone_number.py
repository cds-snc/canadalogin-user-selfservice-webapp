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
