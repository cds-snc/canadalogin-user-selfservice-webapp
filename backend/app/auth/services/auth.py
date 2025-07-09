import logging
from fastapi import Request, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuthError
from app.auth.services.oidc_config import oauth
from app.config import get_settings
from app.utils.access_token import SESSION_USER_ACCESS_TOKEN_KEY
from app.utils.helpers import generate_error_response, format_error_response

logger = logging.getLogger(__name__)


async def get_redirect_url(request: Request):
    """
    Get the redirect URL for the OAuth login flow.
    This function is used to initiate the login process with IBM Verify.
    """
    try:
        config = get_settings()
        # this request.url_for gets the url based on the callback route defined
        callback_route = request.url_for("callback_route")
        redirect_uri = callback_route

        if config.ENVIRONMENT != "local":
            redirect_uri = str(callback_route).replace("http://", "https://")
        logger.info(f"Callback Redirect URI: {redirect_uri}")
        return await oauth.verify.authorize_redirect(request, redirect_uri)
    except OAuthError as e:
        raise Exception(f"OAuth error: {str(e)}")


async def callback_handler(request: Request):
    """
    Get the redirect URL for the OAuth login flow.
    This function is used to initiate the login process with IBM Verify.
    """
    try:
        config = get_settings()

        oidc_response = await oauth.verify.authorize_access_token(request)
        logger.info("OIDC Responsed")

        request.session[SESSION_USER_ACCESS_TOKEN_KEY] = oidc_response.get(
            "access_token"
        )

        redirectValue = config.PROFILE_MANAGEMENT_DOMAIN

        if config.ENVIRONMENT != "local":
            redirectValue = f"https://{config.PROFILE_MANAGEMENT_DOMAIN}"

        logger.info("OIDC Callback Handler")
        logger.info(f"Redirect to PROFILE_MANAGEMENT_DOMAIN: {redirectValue}")
        return RedirectResponse(url=redirectValue)
    except OAuthError as error:
        logger.error(f"OAuth error: {error}")
        return generate_error_response(
            400, format_error_response(str(error))
        )


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
