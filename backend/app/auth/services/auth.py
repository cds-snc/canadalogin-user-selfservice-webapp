import logging
from fastapi import Request, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuthError
from app.auth.services.oidc_config import oauth
from app.config import get_configuration
from app.utils.access_token import SESSION_USER_ACCESS_TOKEN_KEY
from app.utils.helpers import generate_error_response, string_error_response

logger = logging.getLogger(__name__)


async def redirect_to_verify(request: Request):
    """
    Get the redirect URL for the OAuth login flow.
    This function is used to initiate the login process with IBM Verify.
    """
    try:
        config = get_configuration()
        # this request.url_for gets the url based on the callback route defined
        callback_route = request.url_for("callback_route")
        redirect_uri = callback_route
        logger.info("Health check hit - headers: %s", dict(request.headers))

        if config.ENVIRONMENT != "local":
            redirect_uri = str(callback_route).replace("http://", "https://")
        logger.info(f"Callback Redirect URI: {redirect_uri}")
        return await oauth.verify.authorize_redirect(request, redirect_uri)
    except OAuthError as e:
        return generate_error_response(400, string_error_response(str(e)))
    except Exception as e:
        logger.exception("Unexpected error during redirect_to_verify")
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

        try:
            oidc_response = await oauth.verify.authorize_access_token(request)
            logger.info("OIDC Responsed")
        except OAuthError as error:
            logger.error(f"OAuth error during token retrieval: {error}")
            logger.error(f"Redirect user back to IBM Verify to be re-authenticated: {redirectValue}")
            # redirect back to IBM Verify to retry authentication
            return RedirectResponse(url=redirectValue)

        request.session[SESSION_USER_ACCESS_TOKEN_KEY] = oidc_response.get(
            "access_token"
        )

        logger.info("OIDC Callback Handler")
        logger.info(f"Redirect to PROFILE_MANAGEMENT_DOMAIN: {redirectValue}")
        return RedirectResponse(url=redirectValue)
    except OAuthError as error:
        logger.error(f"OAuth error: {error}")
        return generate_error_response(400, string_error_response(str(error)))
    except Exception as e:
        logger.exception("Unexpected error during callback")
        return generate_error_response(500, string_error_response())


async def get_users_current_session(request: Request):
    """
    Session cookie contains an identifier for the user session.
    The user access token is stored in memory on the server
    Authlib docs - https://docs.authlib.org/en/latest/client/fastapi.html
    """
    user_access_token = request.session.get(SESSION_USER_ACCESS_TOKEN_KEY)
    logger.info("Get Users Session")

    if not user_access_token:
        logger.info("Not authenticated")
        raise HTTPException(status_code=401, detail="Not authenticated")
    logger.info("Access Token found in session")
    return user_access_token
