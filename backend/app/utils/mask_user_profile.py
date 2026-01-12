import logging
import phonenumbers
from app.users.schemas import MetaDataTypeValue

logger = logging.getLogger(__name__)


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
    profile_data: dict,
) -> list[MetaDataTypeValue]:
    """
    Mask email addresses in user profile.

    Args:
        profile_data: User profile data dictionary containing emailAddresses

    Returns:
        list[MetaDataTypeValue]: List of emails with masked values
    """

    profile_emails_addresses = profile_data.get("emails")

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
            logger.error(f"Skipping invalid email '{value}': {e}")
            continue

    return masked_email_addresses


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
        logger.error(f"Warning: Skipping invalid phone number '{phone_number}': less than 4 digits")
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
    profile_data: dict,
) -> list[MetaDataTypeValue]:
    """
    Mask phone numbers in user profile data, showing only the last 4 digits.

    Args:
        profile_data: User profile data dictionary containing phoneNumbers

    Returns:
        list[MetaDataTypeValue]: List of phone number objects with masked values
    """

    profile_contact_phone_numbers = profile_data.get("phoneNumbers")

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


def mask_profile_details(profile_data: dict) -> dict:
    """
    Mask sensitive details in the user profile data.

    Args:
        profile_data: User profile data dictionary
    Returns:
        dict: Profile data with masked sensitive details
    """
    profile_data["phoneNumbers"] = mask_contact_phone_numbers(profile_data)

    profile_data["emails"] = mask_profile_email_addresses(profile_data)
    profile_data["userName"] = mask_individual_email_address(
        profile_data.get("userName", "")
    )

    return profile_data
