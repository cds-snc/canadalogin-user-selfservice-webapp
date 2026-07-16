import logging
from urllib.parse import urlencode
import re

from typing import Optional
from fastapi import HTTPException, Request
from fastapi.responses import RedirectResponse
from starsessions.session import get_session_handler
from app.auth.services.oidc_config import oauth
from app.config import get_configuration
from app.constants.session_keys import SessionKeys
from app.auth.services.auth_user_session import update_session_tokens

logger = logging.getLogger(__name__)


def is_safe_return_to_page(return_to_page: Optional[str]) -> bool:
    """Allow only internal relative paths to avoid open redirects."""
    if not return_to_page or not isinstance(return_to_page, str):
        return False

    if not return_to_page.startswith("/") or return_to_page.startswith("//"):
        return False

    # Language root routes do not need explicit returnToPage and can cause
    # noisy URLs like /en?returnToPage=%2Fen when persisted through login.
    return re.fullmatch(r"/(en|fr)/?", return_to_page) is None


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


async def redirect_user_to_idp_verify(
    request: Request,
    prompt: Optional[str] = None,
    returnToPage: Optional[str] = None,
    partner: Optional[str] = None,
):
    """
    Get the redirect URL for the OAuth login flow.
    This function is used to initiate the login process with IBM Verify.
    """
    callback_redirect_uri = get_callback_redirect_uri(request)
    logger.info("Redirecting user to IBM Verify...")

    if is_safe_return_to_page(returnToPage):
        request.session[SessionKeys.RETURN_TO_PAGE.value] = returnToPage
        logger.info(f"Return to page set in session from login: {returnToPage}")

    config = get_configuration()
    provincial_partners_identity_source = (
        config.ibm_verify_config.IBM_VERIFY_PROVINCIAL_PARTNERS_IDENTITY_SOURCE_ID
    )

    partner_to_identity_source = {
        "bcsc": provincial_partners_identity_source,
        "ab": provincial_partners_identity_source,
    }

    extra_params = {}
    if prompt:
        extra_params["prompt"] = prompt
    if partner:
        if partner not in partner_to_identity_source:
            raise HTTPException(status_code=400, detail="Invalid provincial partner")

        identity_source_id = partner_to_identity_source.get(partner)
        if not identity_source_id:
            raise HTTPException(
                status_code=503,
                detail="Provincial partner is not configured",
            )

        extra_params["identity_source_id"] = identity_source_id

    redirect_response = await oauth.verify.authorize_redirect(
        request, callback_redirect_uri, **extra_params
    )
    logger.info("User redirected to IBM Verify for authentication")
    return redirect_response


async def callback_handler(request: Request):
    """
    Handle the OAuth callback from IBM Verify.
    This function processes the response from IBM Verify after user authentication.
    """

    logger.info("OIDC Callback Handler")

    redirectValue = get_base_profile_management_url()
    returnToPageValue = request.session.pop(SessionKeys.RETURN_TO_PAGE.value, None)

    if is_safe_return_to_page(returnToPageValue):
        query_separator = "&" if "?" in returnToPageValue else "?"
        return_to_page_query = urlencode(
            {SessionKeys.RETURN_TO_PAGE.value: returnToPageValue}
        )
        clientRedirectValue = (
            f"{returnToPageValue}{query_separator}{return_to_page_query}"
        )
        redirectValue += clientRedirectValue
        logger.info(f"Return to page set in session: {redirectValue}")

    logger.info("Verify Access Token Request")
    oidc_response = await oauth.verify.authorize_access_token(request)
    logger.info("OIDC Response received from IBM Verify")

    # Get the handler and set your sid as session id. sid is uuid passed in id_token
    handler = get_session_handler(request)
    new_session_id = oidc_response.get("userinfo").get("sid")
    handler.session_id = new_session_id

    update_session_tokens(request, oidc_response)

    logger.info(f"Redirect to PROFILE_MANAGEMENT_DOMAIN: {redirectValue}")
    return RedirectResponse(url=redirectValue)


async def reauthenticate_user(request: Request, returnToPage: str = "/"):
    """
    Get the redirect URL for the OAuth login flow.
    This function is used to initiate a reauthentication flow with IBM Verify.

    Args:
        request: The FastAPI request object
        returnToPage: The page to return to after authentication
    """
    callback_redirect_uri = get_callback_redirect_uri(request)

    if returnToPage:
        request.session[SessionKeys.RETURN_TO_PAGE.value] = returnToPage
        logger.info(f"Return to page set in session: {returnToPage}")
    acr_value = "loa3_stepup"
    # Use acr_values for step-up authentication to require LOA3 level
    return await oauth.verify.authorize_redirect(
        request, callback_redirect_uri, acr_values=acr_value
    )
