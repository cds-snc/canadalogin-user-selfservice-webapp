import asyncio
import logging
import json
from fastapi import Request, HTTPException
from fastapi.responses import RedirectResponse, StreamingResponse, JSONResponse
from authlib.integrations.starlette_client import OAuthError
from app.auth.services.oidc_config import oauth
from app.config import get_configuration
from app.constants.session_keys import SessionKeys
from app.utils.helpers import generate_error_response, string_error_response
from starsessions.session import get_session_handler
import jwt
from fastapi import Response
from app.utils.schemas import ResponseModel
import httpx
from app.auth.services.auth_user_session import (
    get_user_info,
    update_session_tokens,
    get_session_by_session_id,
    remove_session_by_session_id,
    get_user_id_token,
)
from app.utils.request_error_handler import RequestErrorHandler
from urllib.parse import urlencode
from redis.asyncio import Redis
from typing import AsyncGenerator


logger = logging.getLogger(__name__)


async def get_redis_client(request: Request) -> Redis:
    """Get Redis client from the app state."""
    if hasattr(request.app.state, "redis_client"):
        return request.app.state.redis_client
    else:
        # Fallback to creating a new Redis connection if not available
        config = get_configuration()
        redis_url = (
            config.session_config.SESSION_REDIS_URL or "redis://localhost:6379/0"
        )
        return Redis.from_url(redis_url)


def get_base_profile_management_url():
    config = get_configuration()
    redirectValue = config.PROFILE_MANAGEMENT_DOMAIN

    if config.ENVIRONMENT != "local":
        redirectValue = f"https://{config.PROFILE_MANAGEMENT_DOMAIN}"
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
        if oauth.verify is None:
            logger.error("OAuth verify client is not configured properly")
            raise HTTPException(status_code=500, detail="OAuth configuration error")
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
            if oauth.verify is None:
                logger.error("OAuth verify client is not configured properly")
                raise HTTPException(status_code=500, detail="OAuth configuration error")
            oidc_response = await oauth.verify.authorize_access_token(request)
            logger.info("OIDC Responsed")
        except OAuthError as error:
            logger.error(f"OAuth error during token retrieval: {error}")
            logger.error(
                f"Redirect user back to IBM Verify to be re-authenticated: {redirectValue}"
            )
            # redirect back to IBM Verify to retry authentication
            raise OAuthError("Invalid or expired token") from error

        await update_session_tokens(request, oidc_response)

        # Get the handler and set your sid as session id. sid is unique session id from GC Sign-In
        handler = get_session_handler(request)
        new_session_id = oidc_response.get("userinfo").get("sid")
        handler.session_id = new_session_id

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

        if oauth.verify is None:
            logger.error("OAuth verify client is not configured properly")
            raise HTTPException(status_code=500, detail="OAuth configuration error")
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


async def backchannel_logout(request: Request):
    """
    Logs out the user by clearing the session and redirecting to the logout endpoint.
    """
    try:
        config = request.app.state.config

        # from request get logout_token and sub
        logout_form = await request.form()
        logout_token = logout_form.get("logout_token")

        # Validate the logout_token, if not string or empty return 400
        if not logout_token or not isinstance(logout_token, str):
            logger.error("No logout_token provided in backchannel_logout request.")
            raise HTTPException(status_code=400, detail="No logout_token provided")

        # Fetch JWKS from the well-known URL
        jwks_uri = config.oidc_well_known_config.get("jwks_uri")
        if not jwks_uri:
            logger.error("jwks_uri not found in OIDC well-known configuration.")
            raise HTTPException(status_code=500, detail="JWKS URI not configured.")

        async with httpx.AsyncClient() as client:
            jwks_response = await client.get(jwks_uri)
            jwks_response.raise_for_status()
            jwks = jwks_response.json()

        # Decode the logout_token with signature verification using JWKS
        # The 'algorithms' should match what your IdP uses for signing.
        # The 'audience' and 'issuer' should also be verified.
        decoded_token = jwt.decode(
            logout_token,
            key=jwks,
            algorithms=["RS256"],  # Common algorithm for OIDC. Adjust if needed.
            audience=config.IBM_VERIFY_API_CLIENT_ID,  # Your client ID
            issuer=config.oidc_well_known_config.get("issuer"),  # IdP's issuer URL
            options={"verify_signature": True},
        )
        sid = decoded_token.get("sid")

        if not sid:
            logger.error("No 'sid' claim found in logout_token.")
            raise HTTPException(
                status_code=400, detail="No 'sid' claim found in logout_token"
            )
        # Get the handler and set your custom UUID
        handler = get_session_handler(request)
        # Remove the session associated with the 'sub'
        await handler.store.remove(sid)

        logger.info(f"User session for sub '{sid}' cleared.")

        # According to OIDC Back-Channel Logout spec, a 200 OK response is sufficient.
        # No redirect is needed for back-channel logout.
        return Response(status_code=200)
    except Exception as e:
        logger.exception("Unexpected error during backchannel_logout", str(e))
        return generate_error_response(400, string_error_response())


async def logout_user(request: Request):
    """
    Logs out the user by clearing the session and redirecting to the logout endpoint.
    """
    try:
        config = request.app.state.config
        id_token = await get_user_id_token(request)
        if not id_token:
            logger.error("No id_token found in session during logout.")
            raise HTTPException(status_code=400, detail="No id_token found in session")

        user_info = await get_user_info(request)
        # Clear the session
        # request.session.clear()
        # Remove the session associated with the 'sid'
        await remove_session_by_session_id(user_info.get("sid"), request)

        # Construct the logout redirect URL
        end_session_endpoint = config.end_session_endpoint
        post_logout_redirect_uri = get_base_profile_management_url()
        locale = user_info.get("locale", "en")

        # Build the logout URL with query parameters

        params = {
            "id_token_hint": id_token,
            "post_logout_redirect_uri": post_logout_redirect_uri,
            "ui_locales": locale,
        }
        redirect_url = f"{end_session_endpoint}?{urlencode(params)}"

        logger.debug(f"Constructed logout redirect URL: {redirect_url}")

        # Create response with the redirect URL
        response_data = ResponseModel(
            success=True,
            data=redirect_url,
            message="Logout URL constructed successfully",
        )

        # Create a JSON response to set cookie expiration
        response = JSONResponse(content=response_data.model_dump())

        # Expire the session cookie
        cookie_name = config.session_config.SESSION_COOKIE_NAME
        cookie_domain = config.session_config.SESSION_COOKIE_DOMAIN
        cookie_secure = False if config.ENVIRONMENT == "local" else True

        response.delete_cookie(
            key=cookie_name,
            domain=cookie_domain,
            secure=cookie_secure,
            httponly=True,
            samesite="lax",
        )

        logger.info(f"Session cookies '{cookie_name}' expired during logout")

        return response
    except Exception as e:
        logger.exception("Unexpected error during logout", str(e))
        RequestErrorHandler.handle(e, context="Unexpected error during logout")


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
                user_info = await get_user_info(request)
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
