from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuthError
from starlette.requests import Request
from app.auth.services.oidc_config import oauth
from app.config import get_settings


async def get_redirect_url(request: Request):
    """
    Get the redirect URL for the OAuth login flow.
    This function is used to initiate the login process with IBM Verify.
    """
    try:
        # Use the OAuth instance to get the redirect URL
        redirect_uri = request.url_for('callback_route')
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
        token = await oauth.verify.authorize_access_token(request)
        request.session['user'] = dict(token)
        print(f"User session: {request.session['user']}")
        return RedirectResponse(url=config.PROFILE_MANAGEMENT_ORIGIN)
    except OAuthError as e:
        raise Exception(f"OAuth error: {str(e)}")
