from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from app.auth.services.auth_user_session import get_users_current_session
from app.users.services.get_my_profile import dispatch_get_my_profile_from_ibm


async def require_idv_feature_access(
    request: Request,
    user_access_token: Annotated[str, Depends(get_users_current_session)],
) -> None:
    configuration = request.app.state.config
    profile = await dispatch_get_my_profile_from_ibm(
        request.app.state.request_client,
        user_access_token,
    )
    if any(
        group.id in configuration.idv_feature_access_group_ids
        for group in profile.groups or []
    ):
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="IDV feature access is not enabled for this account",
    )
