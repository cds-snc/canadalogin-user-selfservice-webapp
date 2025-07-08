from fastapi import Request, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuthError
from app.auth.services.oidc_config import oauth
from app.config import get_settings
from app.utils.access_token import SESSION_USER_ACCESS_TOKEN_KEY


async def get_redirect_url(request: Request):
    """
    Get the redirect URL for the OAuth login flow.
    This function is used to initiate the login process with IBM Verify.
    """
    try:
        # Use the OAuth instance to get the redirect URL
        redirect_uri = request.url_for("callback_route")
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

        # Use the OAuth instance to handle the callback
        oidc_response = await oauth.verify.authorize_access_token(request)
        request.session[SESSION_USER_ACCESS_TOKEN_KEY] = oidc_response.get(
            "access_token"
        )
        return RedirectResponse(url=config.PROFILE_MANAGEMENT_ORIGIN)
    except OAuthError as e:
        raise Exception(f"OAuth error: {str(e)}")


async def get_users_current_session(request: Request):
    """
    Dependency to extract and validate the session cookie.
    Session cookie contains an identifier for the user session.
    The user access token is stored in memory on the server
    """
    user_access_token = request.session.get(SESSION_USER_ACCESS_TOKEN_KEY)
    if not user_access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_access_token
