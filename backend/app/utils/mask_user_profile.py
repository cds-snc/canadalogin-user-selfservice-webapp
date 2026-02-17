import logging
from app.users.schemas import MetaDataTypeValue
from app.utils.string_masking import mask_phone_number, mask_email_address

logger = logging.getLogger(__name__)


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
            masked_email["value"] = mask_email_address(value)
            masked_email_addresses.append(masked_email)
        except ValueError as e:
            logger.error(f"Skipping invalid email '{value}': {e}")
            continue

    return masked_email_addresses


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
    profile_data["userName"] = mask_email_address(
        profile_data.get("userName", "")
    )

    return profile_data
