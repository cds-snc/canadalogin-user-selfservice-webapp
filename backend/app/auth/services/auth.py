import logging
from fastapi import Request, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuthError
from app.auth.services.oidc_config import oauth
from app.config import get_configuration
from app.constants.session_keys import SessionKeys
from app.utils.helpers import generate_error_response, string_error_response
from starsessions.session import get_session_handler  
import jwt
from fastapi import Response
from app.utils.schemas import ResponseModel
import httpx # Added import

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
            return RedirectResponse(url=redirectValue)

        request.session[SessionKeys.SESSION_USER_ACCESS_TOKEN_KEY.value] = (
            oidc_response.get("access_token")
        )
        request.session[SessionKeys.SESSION_USER_INFO.value] = (
            oidc_response.get("userinfo")
        )
        request.session[SessionKeys.SESSION_USER_REFRESH_TOKEN_KEY.value] = (
            oidc_response.get("refresh_token")
        )
        # Get the handler and set your sid as session id. sid is unique session id from GC Sign-In 
        handler = get_session_handler(request)  
        handler.session_id = oidc_response.get('userinfo').get('sid')


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
    except OAuthError as e:
        logger.exception("Unexpected error during redirect_to_verify", str(e))
        return generate_error_response(401, string_error_response(str(e)))
    except Exception as e:
        logger.exception("Unexpected error during redirect_to_verify", str(e))
        return generate_error_response(500, string_error_response())



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
            algorithms=["RS256"], # Common algorithm for OIDC. Adjust if needed.
            audience=config.IBM_VERIFY_API_CLIENT_ID, # Your client ID
            issuer=config.oidc_well_known_config.get("issuer"), # IdP's issuer URL
            options={"verify_signature": True}
        )
        sid = decoded_token.get("sid")

        if not sid:
            logger.error("No 'sid' claim found in logout_token.")
            raise HTTPException(status_code=400, detail="No 'sid' claim found in logout_token")
        
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