import logging
from urllib.parse import urlencode
from fastapi import Request, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuthError
from app.auth.services.oidc_config import oauth, validate_logout_token
from app.config import get_configuration
from app.constants.session_keys import SessionKeys
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel
from app.auth.schemas import LogoutResponseModel
from app.auth.services.auth_user_session import (
    is_logout_token_processed,
    mark_logout_token_as_processed,
)

logger = logging.getLogger(__name__)


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
        return await oauth.verify.authorize_redirect(request, callback_redirect_uri)
    except Exception as e:
        logger.exception("Unexpected error during redirect_to_verify", str(e))
        RequestErrorHandler.handle(e, context="Unexpected error during idp redirect")


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
        request.session[SessionKeys.SESSION_USER_ACCESS_TOKEN_KEY.value] = (
            oidc_response.get("access_token")
        )
        request.session[SessionKeys.SESSION_USER_ID_TOKEN_KEY.value] = (
            oidc_response.get("id_token")
        )

        logger.info("OIDC Callback Handler")
        logger.info(f"Redirect to PROFILE_MANAGEMENT_DOMAIN: {redirectValue}")
        return RedirectResponse(url=redirectValue)
    except OAuthError as error:
        logger.error(f"OAuth error: {error}")
        raise OAuthError("Invalid or expired token") from error
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        RequestErrorHandler.handle(e, context="Unexpected error during idp redirect")


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
        RequestErrorHandler.handle(e, context="Unexpected error")


async def logout_user(request: Request, id_token: str):
    """
    Logs out the user by clearing the session and redirecting to the logout endpoint.
    """
    try:
        config = request.app.state.config
        request.session.clear()

        # Construct the logout redirect URL
        end_session_endpoint = config.end_session_endpoint
        post_logout_redirect_uri = get_base_profile_management_url()
        # locale = user_info.get("locale", "en")

        # Build the logout URL with query parameters
        # id_token = get_users_id_token(request)
        params = {
            "id_token_hint": id_token,
            "post_logout_redirect_uri": post_logout_redirect_uri,
            # "ui_locales": locale,
        }
        redirect_url = f"{end_session_endpoint}?{urlencode(params)}"

        logger.debug(f"Constructed logout redirect URL: {redirect_url}")

        # Create response with the redirect URL
        response_data = LogoutResponseModel(
            redirect_url=redirect_url, source="logout_button"
        )

        return ResponseModel(
            success=True,
            data=response_data,
            message="Redirect url to logout",
        )
    except Exception as e:
        logger.exception("Unexpected error during logout", str(e))
        RequestErrorHandler.handle(e, context="Unexpected error during logout")


async def backchannel_logout(request: Request):

    try:
        claims = await validate_logout_token(request)
        sid = claims.get("sid")
        jti = claims.get("jti")  # JWT ID - unique identifier for the logout token
        logger.debug(f"Backchannel logout for sid: {sid}, jti: {jti}")

        # Ensure sid is present (it should be based on validation)
        if not sid:
            logger.error("Missing sid claim in logout token")
            raise ValueError("Missing sid claim in logout token")
        # Ensure jti is present (it should be based on validation)
        if not jti:
            logger.error("Missing jti claim in logout token")
            raise ValueError("Missing jti claim in logout token")

        # Check if this logout token has already been processed
        if await is_logout_token_processed(request, jti):
            logger.info(
                f"Logout token {jti} already processed, ignoring duplicate request"
            )
            return ResponseModel(
                success=True, data=None, message="Backchannel logout already processed"
            )

        # Mark this logout token as processed to prevent duplicate processing
        await mark_logout_token_as_processed(request, jti)

        # Try to get Redis client from the application state
        redis_client = getattr(request.app.state, "redis_client", None)
        logger.info(f"Processing backchannel logout for sid: {sid}")
        if redis_client is not None:
            # Use Redis to check if token was processed
            cache_key = f"session:{sid}"
            await redis_client.delete(cache_key)

        return ResponseModel(
            success=True, data=None, message="Backchannel logout successful"
        )
    except ValueError as ve:
        logger.error(f"Value error during backchannel logout: {ve}")
        raise HTTPException(status_code=400, detail=str(ve)) from ve
    except Exception as e:
        logger.exception("Unexpected error during backchannel logout", str(e))
        # IBM Verify expects a 400 response for any error during backchannel logout
        raise HTTPException(
            status_code=400, detail="Internal error during backchannel logout"
        )
