from app.users.schemas import MetaDataTypeValue


def mask_individual_email_address(email: str) -> str:
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
    if not email or "@" not in email:
        raise ValueError("Invalid email format")

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


def mask_profile_email_addresses(
    json_data: dict,
) -> list[MetaDataTypeValue]:
    """
    Mask email addresses in user profile.

    Args:
        json_data: User profile JSON data containing emailAddresses

    Returns:
        list[MetaDataTypeValue]: List of emails with masked values
    """

    profile_emails_addresses = json_data.get("emails")

    if profile_emails_addresses is None:
        return []

    masked_email_addresses = []
    for email in profile_emails_addresses:
        value = email.get("value")
        if not value:
            continue

        try:
            masked_email = email.copy()  # Create a copy of the original email dict
            masked_email["value"] = mask_individual_email_address(value)
            masked_email_addresses.append(masked_email)
        except ValueError as e:
            # Skip invalid emails and log the error
            print(f"Warning: Skipping invalid email '{value}': {e}")
            continue

    return masked_email_addresses
