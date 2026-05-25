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


def mask_contact_number(profile_data: dict) -> None:
    """
    Mask the contactNumber field in the profile data in-place.

    Args:
        profile_data: User profile data dictionary from IBM Verify
    """
    contact_number = profile_data.get("contactNumber")
    if contact_number:
        profile_data["contactNumber"] = mask_phone_number(contact_number)


def mask_profile_details(profile_data: dict) -> dict:
    """
    Mask sensitive details in the user profile data.

    Args:
        profile_data: User profile data dictionary
    Returns:
        dict: Profile data with masked sensitive details
    """
    mask_contact_number(profile_data)

    profile_data["emails"] = mask_profile_email_addresses(profile_data)
    profile_data["userName"] = mask_email_address(profile_data.get("userName", ""))

    return profile_data
