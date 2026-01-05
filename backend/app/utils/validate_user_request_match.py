import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from app.constants.schema_field_names import ID_FIELD

logger = logging.getLogger(__name__)


def validate_user_request_match(
    current_user_profile: Dict[str, Any],
    request_user_id: Optional[str],
) -> None:
    """
    Validate that the current authenticated user matches the user ID in the request.

    Args:
        current_user_profile: User profile data from IBM Verify or Redis Session Data
        request_user_id: User ID from the request payload

    Returns:
        None: If validation passes

    Raises:
        HTTPException: 403 Forbidden if user IDs don't match
        HTTPException: 400 Bad Request if required data is missing
    """
    generic_msg_id = "7"
    # Validate input parameters
    if not isinstance(current_user_profile, dict):
        logger.error("Invalid user profile type for validation")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=generic_msg_id
        )

    # Extract user ID from profile
    current_user_id = current_user_profile.get(ID_FIELD)
    if not current_user_id:
        logger.error("Missing user ID in profile for validation")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=generic_msg_id
        )

    # Check if request user ID is provided
    if not request_user_id:
        logger.error("Missing user ID in request for validation")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=generic_msg_id
        )

    does_user_id_match = request_user_id == current_user_id

    # Perform the validation
    if not does_user_id_match:
        logger.warning(
            f"User mismatch - cannot update profile - {request_user_id} != {current_user_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=generic_msg_id
        )

    logger.debug("User identity validation passed")
