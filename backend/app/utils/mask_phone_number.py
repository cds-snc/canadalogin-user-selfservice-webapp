def mask_phone_number(phone_number: str) -> str:
    """
    Mask the phone number except the last 4 digits.
    """
    try:

        # Extract phone number string only
        digits = "".join(filter(str.isdigit, phone_number))

        # Mask everything except the last 4
        last4 = digits[-4:]
        masked = f"(***) *** {last4}"

        return masked
    except Exception as e:
        return f"Invalid phone number: {str(e)}"
