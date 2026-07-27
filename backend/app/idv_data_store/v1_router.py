import logging

from fastapi import APIRouter, Depends, Request, status

from app.auth.services.auth_user_session import get_users_current_session
from app.idv_data_store.services.verified_claims import get_verified_identity_claims
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/verified-claims",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    tags=["IDV Data Store"],
    summary="Get the authenticated user's verified identity claims from idv-data-store",
    description=(
        "Exchanges the user's access_token with IBM Verify (RFC 8693 OAuth 2.0 "
        "Token Exchange) for a new access_token scoped specifically to "
        "idv-data-store, then calls idv-data-store to retrieve the user's "
        "verified identity claims. The user's original, broadly-scoped "
        "access_token is never shared with idv-data-store."
    ),
)
async def get_verified_claims(
    request: Request,
    user_access_token: str = Depends(get_users_current_session),
):
    return await get_verified_identity_claims(
        request.app.state.request_client, user_access_token
    )
