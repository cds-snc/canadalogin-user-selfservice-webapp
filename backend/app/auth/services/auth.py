import logging

from fastapi import Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuthError
from starsessions.session import get_session_handler
from app.auth.services.oidc_config import oauth
from app.config import get_configuration
from app.constants.session_keys import SessionKeys
from app.utils.request_error_handler import RequestErrorHandler
from app.auth.services.auth_user_session import update_session_tokens

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
        logger.info("Redirecting user to IBM Verify...")
        redirect_response = await oauth.verify.authorize_redirect(
            request, callback_redirect_uri
        )
        logger.info("User redirected to IBM Verify for authentication")
        return redirect_response
    except Exception as e:
        logger.exception("Unexpected error during redirect_to_verify: %s", str(e))
        RequestErrorHandler.handle(e, context="Unexpected error during idp redirect")


async def callback_handler(request: Request):
    """
    Handle the OAuth callback from IBM Verify.
    This function processes the response from IBM Verify after user authentication.
    """

    logger.info("OIDC Callback Handler")

    try:
        redirectValue = get_base_profile_management_url()
        returnToPageValue = request.session.get(SessionKeys.RETURN_TO_PAGE.value)

        if returnToPageValue:
            clientRedirectValue = f"{returnToPageValue}?{SessionKeys.RETURN_TO_PAGE.value}={returnToPageValue}"
            redirectValue += clientRedirectValue
            logger.info(f"Return to page set in session: {redirectValue}")

        try:
            logger.info("Verify Access Token Request")
            oidc_response = await oauth.verify.authorize_access_token(request)
            logger.info("OIDC Response received from IBM Verify")
            
            # Debug log the OIDC response structure in local environment
            config = get_configuration()
            if config.ENVIRONMENT == "local":
                logger.info(f"OIDC Response keys: {list(oidc_response.keys()) if oidc_response else 'None'}")
                
        except OAuthError as error:
            logger.error(f"OAuth error during token retrieval: {error}")
            logger.error(
                f"Redirect user back to IBM Verify to be re-authenticated: {redirectValue}"
            )
            # redirect back to IBM Verify to retry authentication
            raise OAuthError("Invalid or expired token") from error

        # Get the handler and set your sid as session id. sid is uuid passed in id_token
        handler = get_session_handler(request)
        new_session_id = oidc_response.get("userinfo").get("sid")
        handler.session_id = new_session_id

        update_session_tokens(request, oidc_response)

        logger.info(f"Redirect to PROFILE_MANAGEMENT_DOMAIN: {redirectValue}")
        return RedirectResponse(url=redirectValue)
    except OAuthError as error:
        logger.error(f"OAuth error: {error}")
        raise OAuthError("Invalid or expired token") from error
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        RequestErrorHandler.handle(e, context="Unexpected error during idp redirect")


async def reauthenticate_user(request: Request, returnToPage: str = "/", acr_values: str = None):
    """
    Get the redirect URL for the OAuth login flow.
    This function is used to initiate a reauthentication flow with IBM Verify.
    
    Args:
        request: The FastAPI request object
        returnToPage: The page to return to after authentication
        acr_values: If provided, uses acr_values for step-up authentication (e.g., "loa3_stepup")
                   If not provided, uses max_age for standard reauthentication
    """
    try:

        callback_redirect_uri = get_callback_redirect_uri(request)

        if returnToPage:
            request.session[SessionKeys.RETURN_TO_PAGE.value] = returnToPage
            logger.info(f"Return to page set in session: {returnToPage}")

        if acr_values:
            # Use acr_values for step-up authentication to require LOA3 level
            return await oauth.verify.authorize_redirect(
                request, callback_redirect_uri, acr_values=acr_values
            )
        else:
            # if the user recently logged in, we can set the max age to 15 minutes
            # will reauthenticate after max age value
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
