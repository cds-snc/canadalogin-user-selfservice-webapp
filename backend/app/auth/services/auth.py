import asyncio
import logging
import json
from typing import AsyncGenerator
from fastapi import Request
from fastapi.responses import RedirectResponse, StreamingResponse
from authlib.integrations.starlette_client import OAuthError
from starsessions.session import get_session_handler
from app.auth.services.oidc_config import oauth
from app.config import get_configuration
from app.constants.session_keys import SessionKeys
from app.utils.request_error_handler import RequestErrorHandler
from app.auth.services.auth_user_session import (
    update_session_tokens,
    get_user_info,
    get_session_by_session_id,
)

logger = logging.getLogger(__name__)


def get_base_profile_management_url():
    config = get_configuration()
    redirectValue = config.PROFILE_MANAGEMENT_DOMAIN

    if config.ENVIRONMENT != "local":
        redirectValue = f"https://{config.PROFILE_MANAGEMENT_DOMAIN}"
    else:
        redirectValue = f"http://{config.PROFILE_MANAGEMENT_DOMAIN}"
    return redirectValue


def get_callback_redirect_uri(request: Request):
    """
    Get the redirect URI for the OAuth login flow.
    """
    config = get_configuration()
    redirect_uri = request.url_for(SessionKeys.CALLBACK_ROUTE_NAME.value)

    if config.ENVIRONMENT != "local":
        redirect_uri = str(redirect_uri).replace("http://", "https://")

    logger.info(f"Callback Redirect URI: {redirect_uri}")
    return redirect_uri


async def redirect_user_to_idp_verify(request: Request):
    """
    Get the redirect URL for the OAuth login flow.
    This function is used to initiate the login process with IBM Verify.
    """
    try:
        callback_redirect_uri = get_callback_redirect_uri(request)
        return await oauth.verify.authorize_redirect(request, callback_redirect_uri)
    except Exception as e:
        logger.exception("Unexpected error during redirect_to_verify", str(e))
        raise RequestErrorHandler.handle(
            e, context="Unexpected error during idp redirect"
        )


async def callback_handler(request: Request):
    """
    Get the redirect URL for the OAuth login flow.
    This function is used to initiate the login process with IBM Verify.
    """
    try:
        redirectValue = get_base_profile_management_url()
        returnToPageValue = request.session.get(SessionKeys.RETURN_TO_PAGE.value)

        if returnToPageValue:
            clientRedirectValue = f"{returnToPageValue}?{SessionKeys.RETURN_TO_PAGE.value}={returnToPageValue}"
            redirectValue += clientRedirectValue
            logger.info(f"Return to page set in session: {redirectValue}")

        try:
            oidc_response = await oauth.verify.authorize_access_token(request)
            logger.info("OIDC Responsed")
        except OAuthError as error:
            logger.error(f"OAuth error during token retrieval: {error}")
            logger.error(
                f"Redirect user back to IBM Verify to be re-authenticated: {redirectValue}"
            )
            # redirect back to IBM Verify to retry authentication
            raise OAuthError("Invalid or expired token") from error

        # Get the handler and set your sid as session id. sid is unique session id from GC Sign-In
        handler = get_session_handler(request)
        new_session_id = oidc_response.get("userinfo").get("sid")
        handler.session_id = new_session_id

        update_session_tokens(request, oidc_response)

        logger.info("OIDC Callback Handler")
        logger.info(f"Redirect to PROFILE_MANAGEMENT_DOMAIN: {redirectValue}")
        return RedirectResponse(url=redirectValue)
    except OAuthError as error:
        logger.error(f"OAuth error: {error}")
        raise OAuthError("Invalid or expired token") from error
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise RequestErrorHandler.handle(
            e, context="Unexpected error during idp redirect"
        )


async def reauthenticate_user(request: Request, returnToPage: str = "/"):
    """
    Get the redirect URL for the OAuth login flow.
    This function is used to initiate a reauthentication flow with IBM Verify.
    """
    try:

        callback_redirect_uri = get_callback_redirect_uri(request)

        if returnToPage:
            request.session[SessionKeys.RETURN_TO_PAGE.value] = returnToPage
            logger.info(f"Return to page set in session: {returnToPage}")

        # if the user recently logged in, we can set the max age to 15 minutes
        # will reautenticate after max age value
        max_age_in_seconds = 900
        return await oauth.verify.authorize_redirect(
            request, callback_redirect_uri, max_age=max_age_in_seconds
        )
    except OAuthError as error:
        logger.exception("Unexpected error during redirect_to_verify")
        raise OAuthError("Invalid or expired token") from error
    except Exception as e:
        logger.exception("Unexpected error during redirect_to_verify")
        raise RequestErrorHandler.handle(e, context="Unexpected error")


async def session_event_sse_generator(request: Request):
    async def event_stream(request: Request) -> AsyncGenerator[str, None]:
        """
        Generate Server-Sent Events (SSE) for a user session.
        """
        try:
            config = get_configuration()
            while True:
                if request._is_disconnected:
                    logger.info("Client disconnected from SSE stream")
                    break
                user_info = get_user_info(request)
                if user_info is None:
                    logger.info("User not logged in")
                    message_data = {"status": "non-authenticated"}
                    yield f"data: {json.dumps(message_data)}\n\n"
                    break
                await asyncio.sleep(5)
                session_data = await get_session_by_session_id(
                    user_info.get("sid"), request
                )
                if not session_data or not session_data.get(
                    SessionKeys.SESSION_USER_INFO.value
                ):
                    message_data = {"status": "terminated"}
                    yield f"data: {json.dumps(message_data)}\n\n"
                    break
                else:
                    session_metadata = session_data.get(
                        SessionKeys.SESSION_METADATA.value
                    )
                    session_expire = config.session_config.SESSION_LIFETIME
                    if session_metadata:
                        last_access = session_metadata.get(
                            SessionKeys.SESSION_METADATA_LAST_ACCESS.value
                        )
                    if last_access:
                        session_expire = last_access + session_expire - 30
                    # Prepare message data with optional last_access info
                    message_data = {"status": "active", "expire": session_expire}
                    yield f"data: {json.dumps(message_data)}\n\n"
        except asyncio.CancelledError:
            logger.info("SSE stream cancelled")
        except Exception as e:
            logger.error(f"Error in event stream: {str(e)}")
            message_data = {
                "status": "error",
                "error": "An internal error has occurred.",
            }
            yield f"data: {json.dumps(message_data)}\n\n"

    return StreamingResponse(
        event_stream(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
