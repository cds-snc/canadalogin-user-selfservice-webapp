import logging
from urllib.parse import urlencode
from fastapi import Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuthError
from starsessions.session import get_session_handler
from app.auth.services.oidc_config import oauth
from app.config import get_configuration
from app.constants.session_keys import SessionKeys
from app.utils.request_error_handler import RequestErrorHandler
from app.auth.services.auth_user_session import update_session_tokens
from app.utils.schemas import ResponseModel
from app.auth.schemas import LogoutResponseModel

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
    # placeholder for backchannel logout logic
    return ResponseModel(
        success=True, data=None, message="Backchannel logout successful"
    )
