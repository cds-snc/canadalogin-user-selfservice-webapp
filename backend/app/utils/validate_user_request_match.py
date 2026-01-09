import logging
from fastapi import HTTPException, Request, status
from app.users.services.get_my_profile import get_my_profile


logger = logging.getLogger(__name__)


async def validate_user_id_matches_session(
    request: Request, user_access_token: str, request_user_id: str
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
    generic_msg_id = "7"

    # session_user_profile: User profile data from Session Data
    user_profile_response = await get_my_profile(
        request.app.state.request_client, user_access_token
    )
    user_profile = user_profile_response.data

    # Extract user ID from profile
    profile_user_id = user_profile.id
    if not profile_user_id:
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

    does_user_id_match = request_user_id == profile_user_id

    # Perform the validation
    if not does_user_id_match:
        logger.error(
            f"User mismatch - cannot update profile - {request_user_id} != {profile_user_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=generic_msg_id
        )

    logger.debug("User identity validation passed")
