import logging
from fastapi import Request, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuthError
from app.auth.services.oidc_config import oauth
from app.config import get_configuration
from app.constants.session_keys import SessionKeys
from app.utils.helpers import generate_error_response, string_error_response

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
    except OAuthError as e:
        logger.exception("Unexpected error during redirect_to_verify", str(e))
        return generate_error_response(401, string_error_response(str(e)))
    except Exception as e:
        logger.exception("Unexpected error during redirect_to_verify", str(e))
        return generate_error_response(500, string_error_response())


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

        if request.session.get(SessionKeys.RETURN_TO_PAGE.value):
            redirectValue += request.session.get(SessionKeys.RETURN_TO_PAGE.value)
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
            return RedirectResponse(url=redirectValue)

        request.session[SessionKeys.SESSION_USER_ACCESS_TOKEN_KEY.value] = (
            oidc_response.get("access_token")
        )

        logger.info("OIDC Callback Handler")
        logger.info(f"Redirect to PROFILE_MANAGEMENT_DOMAIN: {redirectValue}")
        return RedirectResponse(url=redirectValue)
    except OAuthError as error:
        logger.error(f"OAuth error: {error}")
        return generate_error_response(401, string_error_response(str(error)))
    except Exception as e:
        logger.error(f"OAuth error: {e}")
        return generate_error_response(500, string_error_response())


async def get_users_current_session(request: Request):
    """
    Session cookie contains an identifier for the user session.
    The user access token is stored in memory on the server
    Authlib docs - https://docs.authlib.org/en/latest/client/fastapi.html
    """
    user_access_token = request.session.get(
        SessionKeys.SESSION_USER_ACCESS_TOKEN_KEY.value
    )
    logger.info("Get Users Session")

    if not user_access_token:
        logger.info("Not authenticated")
        raise HTTPException(status_code=401, detail="Not authenticated")
    logger.info("Access Token found in session")
    return user_access_token


async def reauthenticate_user(request: Request, returnToPage: str = "/"):
    """
    Get the redirect URL for the OAuth login flow.
    This function is used to initiate the login process with IBM Verify.
    """
    try:

        callback_redirect_uri = get_callback_redirect_uri(request)

        if returnToPage:
            request.session[SessionKeys.RETURN_TO_PAGE.value] = returnToPage
            logger.info(f"Return to page set in session: {returnToPage}")

        return await oauth.verify.authorize_redirect(
            request, callback_redirect_uri, acr_values="update_password"
        )
    except OAuthError as e:
        logger.exception("Unexpected error during redirect_to_verify", str(e))
        return generate_error_response(401, string_error_response(str(e)))
    except Exception as e:
        logger.exception("Unexpected error during redirect_to_verify", str(e))
        return generate_error_response(500, string_error_response())
