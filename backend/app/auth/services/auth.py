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
from datetime import datetime
from app.auth.services.auth_user_session import update_session_tokens
from app.utils.request_error_handler import RequestErrorHandler
from urllib.parse import urlencode

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
        RequestErrorHandler.handle(
            e, context="Unexpected error during idp redirect"
        )


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
        await update_session_tokens(request, oidc_response)

        # Get the handler and set your sid as session id. sid is unique session id from GC Sign-In 
        handler = get_session_handler(request)  
        handler.session_id = oidc_response.get('userinfo').get('sid')


        logger.info("OIDC Callback Handler")
        logger.info(f"Redirect to PROFILE_MANAGEMENT_DOMAIN: {redirectValue}")
        return RedirectResponse(url=redirectValue)
    except OAuthError as error:
        logger.error(f"OAuth error: {error}")
        raise OAuthError("Invalid or expired token") from error
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        RequestErrorHandler.handle(
            e, context="Unexpected error during idp redirect"
        )


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
        logger.exception("Unexpected error during redirect_to_verify")
        raise OAuthError("Invalid or expired token") from error
    except Exception as e:
        logger.exception("Unexpected error during redirect_to_verify")
        RequestErrorHandler.handle(e, context="Unexpected error")



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
    
async def logout_user(request: Request):
    """
    Logs out the user by clearing the session and redirecting to the logout endpoint.
    """
    try:
        config = request.app.state.config
        id_token = await get_id_token(request)

        # Clear the session
        request.session.clear()
     
        if not id_token:
            logger.error("No id_token found in session during logout.")
            raise HTTPException(status_code=400, detail="No id_token found in session")
        
        # Construct the logout redirect URL
        end_session_endpoint = config.end_session_endpoint
        post_logout_redirect_uri = get_base_profile_management_url()
        
        # Build the logout URL with query parameters
        
        params = {
            "id_token_hint": id_token,
            "post_logout_redirect_uri": post_logout_redirect_uri
        }
        redirect_url = f"{end_session_endpoint}?{urlencode(params)}"
        
        logger.debug(f"Constructed logout redirect URL: {redirect_url}")

        # Return the redirect URL for the client to use
        return ResponseModel(
            success=True,
            data=redirect_url,
            message="Logout URL constructed successfully",
        )
    except Exception as e:
        logger.exception("Unexpected error during logout", str(e))
        RequestErrorHandler.handle(e, context="Unexpected error during logout")


async def refresh_id_token(refresh_token: str):
    """
    Refreshes the id_token using the refresh_token.
    """
    try:
        new_tokens = await oauth.verify.fetch_access_token(refresh_token=refresh_token, grant_type="refresh_token")
        return new_tokens
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        return None


async def get_id_token(request: Request):
    """
    Get the id_token from the session, refreshing it if necessary.
    """
    id_token = request.session.get(SessionKeys.SESSION_USER_ID_TOKEN_KEY.value)

    if not id_token:
        return None

    try:
        decoded_token = jwt.decode(id_token, options={"verify_signature": False})
        exp = decoded_token.get("exp")
        if exp and exp < datetime.now().timestamp() + 60:  # If token expires in 1 minute
            refresh_token = request.session.get(SessionKeys.SESSION_USER_REFRESH_TOKEN_KEY.value)
            if not refresh_token:
                return None

            new_tokens = await refresh_id_token(refresh_token)
            if not new_tokens:
                return None
            
            userinfo = await oauth.verify.parse_id_token(new_tokens, None)
            new_tokens["userinfo"] = userinfo

            await update_session_tokens(request, new_tokens)
            return new_tokens.get("id_token")
    except jwt.PyJWTError as e:
        logger.error(f"Error decoding token: {e}")
        return None

    return id_token
    
