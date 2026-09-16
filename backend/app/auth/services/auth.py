import logging
import re
from urllib.parse import quote, urlparse

from typing import Optional
from fastapi import HTTPException, Request
from fastapi.responses import RedirectResponse
from starsessions.session import get_session_handler
from app.auth.services.oidc_config import oauth
from app.config import get_configuration
from app.constants.session_keys import SessionKeys
from app.auth.services.auth_user_session import update_session_tokens
from authlib.integrations.starlette_client import OAuthError

logger = logging.getLogger(__name__)
SUPPORTED_LOGIN_LANGUAGES = {"en", "fr"}


def build_identity_source_redirect_url(
    tenant_url: str,
    identity_source_path_segment: str,
    target_url: str,
) -> Optional[str]:
    if not tenant_url or not identity_source_path_segment or not target_url:
        return None

    parsed_tenant_url = urlparse(tenant_url)
    if (
        parsed_tenant_url.scheme not in {"http", "https"}
        or not parsed_tenant_url.netloc
    ):
        return None

    tenant_base_url = f"{parsed_tenant_url.scheme}://{parsed_tenant_url.netloc}"
    encoded_target_url = quote(target_url, safe="")

    return (
        f"{tenant_base_url}/auth/{identity_source_path_segment}"
        f"?Target={encoded_target_url}&app_login=false"
    )


def is_safe_return_to_page(return_to_page: Optional[str]) -> bool:
    """Allow only internal relative paths to avoid open redirects."""
    if not return_to_page or not isinstance(return_to_page, str):
        return False

    if not return_to_page.startswith("/") or return_to_page.startswith("//"):
        return False

    # Language root routes do not need explicit returnToPage and can cause
    # noisy URLs like /en?returnToPage=%2Fen when persisted through login.
    return re.fullmatch(r"/(en|fr)/?", return_to_page) is None


def normalize_login_language(lang: Optional[str]) -> Optional[str]:
    if not lang or not isinstance(lang, str):
        return None

    normalized_lang = lang.strip().lower()
    if normalized_lang in SUPPORTED_LOGIN_LANGUAGES:
        return normalized_lang

    return None


def extract_language_from_path(path: Optional[str]) -> Optional[str]:
    if not path or not isinstance(path, str):
        return None

    language_match = re.match(r"^/(en|fr)(?:/|$)", path.strip().lower())
    if language_match:
        return language_match.group(1)

    return None


def resolve_oidc_login_language(
    request: Request,
    lang: Optional[str],
    return_to_page: Optional[str],
) -> Optional[str]:
    normalized_lang = normalize_login_language(lang)
    if normalized_lang:
        return normalized_lang

    route_lang = extract_language_from_path(return_to_page)
    if route_lang:
        return route_lang

    referer = request.headers.get("referer")
    if not referer:
        return None

    return extract_language_from_path(urlparse(referer).path)


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
    lang: Optional[str] = None,
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
    else:
        logger.info("Return to page ignored (unsafe or empty): %s", returnToPage)

    config = get_configuration()
    provincial_partners_identity_source = (
        config.ibm_verify_config.IBM_VERIFY_PROVINCIAL_PARTNERS_IDENTITY_SOURCE_ID
    )

    partner_to_identity_source = {
        "bc": provincial_partners_identity_source,
        "ab": provincial_partners_identity_source,
    }

    extra_params = {}
    extra_params["response_type"] = "code"
    resolved_lang = resolve_oidc_login_language(request, lang, returnToPage)
    if resolved_lang:
        extra_params["lang"] = resolved_lang

    if prompt:
        extra_params["prompt"] = prompt
    if partner:
        normalized_partner = partner.lower()
        if normalized_partner not in partner_to_identity_source:
            raise HTTPException(status_code=400, detail="Invalid provincial partner")

        identity_source_id = partner_to_identity_source.get(normalized_partner)
        if not identity_source_id:
            raise HTTPException(
                status_code=503,
                detail="Provincial partner is not configured",
            )

        extra_params["identity_source_id"] = identity_source_id

    redirect_response = await oauth.verify.authorize_redirect(
        request, callback_redirect_uri, **extra_params
    )

    if partner and provincial_partners_identity_source:
        oauth_authorize_redirect_url = redirect_response.headers.get("location")
        if oauth_authorize_redirect_url:
            idp_redirect_url = build_identity_source_redirect_url(
                config.ibm_verify_config.IBM_VERIFY_TENANT_URL,
                provincial_partners_identity_source,
                oauth_authorize_redirect_url,
            )
            if idp_redirect_url:
                redirect_response.headers["location"] = idp_redirect_url

    logger.info("User redirected to IBM Verify for authentication")
    return redirect_response


async def callback_handler(request: Request):
    """
    Handle the OAuth callback from IBM Verify.
    This function processes the response from IBM Verify after user authentication.
    """

    logger.info("OIDC Callback Handler")

    redirectValue = get_base_profile_management_url()
    logger.info(
        "Session returnToPage before pop: %s",
        request.session.get(SessionKeys.RETURN_TO_PAGE.value),
    )
    returnToPageValue = request.session.pop(SessionKeys.RETURN_TO_PAGE.value, None)

    if is_safe_return_to_page(returnToPageValue):
        redirectValue += returnToPageValue
        logger.info(f"Return to page set in session: {redirectValue}")

    logger.info("Verify Access Token Request")
    try:
        oidc_response = await oauth.verify.authorize_access_token(request)
    except OAuthError:
        raise
    except Exception:
        logger.exception(
            "Unexpected error during OIDC callback - to authorize_access_token"
        )
        raise

    logger.info("OIDC Response received from IBM Verify")
    oidc_userinfo = oidc_response.get("userinfo") or {}
    oidc_session_id = oidc_userinfo.get("sid")
    if not oidc_session_id:
        raise OAuthError(
            error="invalid_oidc_response",
            description="Required sid claim is missing",
        )

    # Get the handler and set your sid as session id. sid is uuid passed in id_token
    handler = get_session_handler(request)
    new_session_id = oidc_session_id
    handler.session_id = new_session_id

    update_session_tokens(request, oidc_response)

    logger.info(f"Redirect to PROFILE_MANAGEMENT_DOMAIN: {redirectValue}")
    return RedirectResponse(url=redirectValue)


async def reauthenticate_user(
    request: Request,
    returnToPage: str = "/",
    lang: Optional[str] = None,
):
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
    resolved_lang = resolve_oidc_login_language(request, lang, returnToPage)
    reauth_params = {"acr_values": acr_value}
    if resolved_lang:
        reauth_params["lang"] = resolved_lang

    # Use acr_values for step-up authentication to require LOA3 level
    return await oauth.verify.authorize_redirect(
        request, callback_redirect_uri, **reauth_params
    )
