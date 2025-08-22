import logging
from fastapi import Request, HTTPException, status
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuthError
from app.auth.services.oidc_config import oauth
from app.config import get_configuration
from app.constants.session_keys import SessionKeys
from app.utils.helpers import generate_error_response, string_error_response
from app.utils.request_error_handler import RequestErrorHandler

logger = logging.getLogger(__name__)


def get_callback_redirect_uri(request: Request):
    """
    Get the redirect URI for the OAuth login flow.
    This function is used to initiate the login process with IBM Verify.
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
        raise RequestErrorHandler.handle(e, context="Unexpected error during idp redirect")


async def callback_handler(request: Request):
    """
    Get the redirect URL for the OAuth login flow.
    This function is used to initiate the login process with IBM Verify.
    """
    try:
        config = get_configuration()
        redirectValue = config.PROFILE_MANAGEMENT_DOMAIN

        if config.ENVIRONMENT != "local":
            redirectValue = f"https://{config.PROFILE_MANAGEMENT_DOMAIN}"

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
            raise OAuthError("Invalid or expired token")
        request.session[SessionKeys.SESSION_USER_ACCESS_TOKEN_KEY.value] = (
            oidc_response.get("access_token")
        )

        logger.info("OIDC Callback Handler")
        logger.info(f"Redirect to PROFILE_MANAGEMENT_DOMAIN: {redirectValue}")
        return RedirectResponse(url=redirectValue)
    except OAuthError as error:
        logger.error(f"OAuth error: {error}")
        raise OAuthError("Invalid or expired token")
    except Exception as e:
        logger.error(f"OAuth error: {e}")
        raise RequestErrorHandler.handle(e, context="Unexpected error during idp redirect")


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

        return await oauth.verify.authorize_redirect(
            request, callback_redirect_uri, acr_values="update_password"
        )
    except OAuthError as error:
        logger.exception("Unexpected error during redirect_to_verify", str(e))
        raise OAuthError("Invalid or expired token")
    except Exception as e:
        logger.exception("Unexpected error during redirect_to_verify", str(e))
        raise RequestErrorHandler.handle(e, context="Unexpected error")
