import logging
from fastapi import HTTPException, Request, status
from app.constants.schema_field_names import UID_FIELD
from app.auth.services.auth_user_session import get_user_info

logger = logging.getLogger(__name__)


async def validate_user_id_matches_session(
    request: Request, request_user_id: str
) -> None:
    """
    Validate that the current authenticated user session matches the user ID in the request.

    Args:
        request_user_id: User ID from the request payload

    Returns:
        None: If validation passes

    Raises:
        HTTPException: 403 Forbidden if user IDs don't match
        HTTPException: 400 Bad Request if required data is missing
    """

    # session_user_profile: User profile data from Session Data
    session_user_profile = await get_user_info(request)

    generic_msg_id = "7"
    # Validate input parameters
    if not isinstance(session_user_profile, dict):
        logger.error("Invalid userinfo from token - expected dict")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=generic_msg_id
        )

    # Extract user ID from profile
    session_user_id = session_user_profile.get(UID_FIELD)
    if not session_user_id:
        logger.error("Missing user UID in profile for validation")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=generic_msg_id
        )

    # Check if request user ID is provided
    if not request_user_id:
        logger.error("Missing user ID in request for validation")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=generic_msg_id
        )

    does_user_id_match = request_user_id == session_user_id

    # Perform the validation
    if not does_user_id_match:
        logger.error(
            f"User mismatch - cannot update profile - {request_user_id} != {session_user_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=generic_msg_id
        )

    logger.debug("User identity validation passed")
