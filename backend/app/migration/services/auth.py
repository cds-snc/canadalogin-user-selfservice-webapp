import logging

from fastapi import Request

from app.auth.services.auth import redirect_user_to_idp_verify
from app.constants.session_keys import SessionKeys
from app.utils.request_error_handler import RequestErrorHandler

logger = logging.getLogger(__name__)


async def migration_auth(
    request: Request,
    client_id: str,
):
    """
    Add LinkPrompt as the return to page and get the redirect URL for the OAuth login flow.
    """
    try:

        request.session[SessionKeys.RP_CLIENT_ID_KEY.value] = client_id
        request.session[SessionKeys.RETURN_TO_PAGE.value] = "/en/LinkPrompt"

        return await redirect_user_to_idp_verify(request)

    except Exception as e:
        logger.exception("Unexpected error during redirect_to_verify", str(e))
        RequestErrorHandler.handle(e, context="Unexpected error during idp redirect")
