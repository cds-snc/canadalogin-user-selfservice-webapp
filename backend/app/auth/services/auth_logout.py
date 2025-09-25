import logging
from fastapi import Request, HTTPException
from urllib.parse import urlencode
from authlib.jose import jwt
from authlib.jose.errors import JoseError
from authlib.jose.rfc7519.jwt import create_load_key
from app.auth.services.oidc_config import oauth
from app.auth.services.auth_user_session import get_user_info
from app.auth.services.auth import get_base_profile_management_url
from app.utils.schemas import ResponseModel
from app.auth.schemas import LogoutResponseModel
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.redis import get_redis_client
from app.constants.redis_keys import RedisKeys

logger = logging.getLogger(__name__)


async def validate_logout_token(request: Request):
    """Validate logout token using your registered OAuth client"""
    form_data = await request.form()
    if form_data is None:
        raise ValueError("Missing logout_token parameter")
    form_dict = dict(form_data)

    logout_token = form_dict.get("logout_token")
    if logout_token is None or not isinstance(logout_token, str):
        raise ValueError("Missing logout_token parameter Or invalid type")

    # Get your registered client
    client = oauth.verify
    if client is None:
        raise ValueError("OAuth client 'verify' is not registered")

    jwk_set_data = await client.fetch_jwk_set()
    load_key = create_load_key(jwk_set_data)

    # Configure logout token specific claims
    claims_options = {
        "aud": {"essential": True, "value": client.client_id},
        "iat": {"essential": True},
        "jti": {"essential": True},
        "events": {"essential": True, "validate": _validate_logout_events},
        "sid": {"essential": False},  # Session ID (optional)
        "sub": {"essential": False},  # Subject (optional)
        "nonce": {"essential": False, "validate": _reject_nonce},  # Must be None
    }

    try:
        claims = jwt.decode(logout_token, key=load_key, claims_options=claims_options)
        claims.validate(leeway=120)
        return claims
    except JoseError as e:
        raise ValueError(f"Invalid logout token: {e}")


def _validate_logout_events(claims, events):
    """Validate the events claim contains logout event"""
    logout_event_uri = "http://schemas.openid.net/event/backchannel-logout"
    return isinstance(events, dict) and logout_event_uri in events


def _reject_nonce(claims, nonce):
    """Logout tokens MUST NOT contain nonce"""
    return nonce is None


async def is_logout_processed(request: Request, sid: str) -> bool:
    """
    Check if a logout token (identified by sid) has already been processed.

    Args:
        request: FastAPI request object
        sid: Session ID from the logout token

    Returns:
        bool: True if the token has already been processed, False otherwise
    """
    if not sid:
        return False

    # Try to get Redis client from the application state
    redis_client = get_redis_client(request)
    # Use Redis to check if token was processed
    cache_key = f"{RedisKeys.REDIS_LOGOUT_SESSION_KEY.value}{sid}"
    result = await redis_client.get(cache_key)
    return result is not None


async def mark_session_logout(
    request: Request, sid: str, source: str, expiration_seconds: int = 1800
):
    """
    Mark a logout token (identified by sid) as processed to prevent duplicate processing.

    Args:
        request: FastAPI request object
        sid: Session ID from the logout token
        expiration_seconds: How long to remember this token (default: 30 minutes)
    """
    if not sid:
        return

    # Try to get Redis client from the application state
    redis_client = get_redis_client(request)
    # Use Redis to store the processed token with expiration
    cache_key = f"{RedisKeys.REDIS_LOGOUT_SESSION_KEY.value}{sid}"
    await redis_client.setex(cache_key, expiration_seconds, source)
    logger.debug(
        f"Marked logout session {sid} as processed in Redis with {expiration_seconds}s expiration, and source from {source}"
    )


async def logout_user(request: Request, id_token: str):
    """
    Logs out the user by clearing the session and redirecting to the logout endpoint.
    """
    try:
        config = request.app.state.config
        user_info = await get_user_info(request)

        # Construct the logout redirect URL
        end_session_endpoint = config.end_session_endpoint
        post_logout_redirect_uri = get_base_profile_management_url()
        locale = user_info.get("locale", "en")
        # Build the logout URL with query parameters
        params = {
            "id_token_hint": id_token,
            "post_logout_redirect_uri": post_logout_redirect_uri,
            "ui_locales": locale,
        }
        redirect_url = f"{end_session_endpoint}?{urlencode(params)}"
        logger.debug(f"Constructed logout redirect URL: {redirect_url}")

        # Create response with the redirect URL
        response_data = LogoutResponseModel(
            redirect_url=redirect_url, source="logout_button"
        )
        # Clear the session
        request.session.clear()

        await mark_session_logout(
            request, sid=user_info.get("sid"), source="logout_button"
        )

        return ResponseModel(
            success=True,
            data=response_data,
            message="Redirect url to logout",
        )
    except Exception as e:
        logger.exception("Unexpected error during logout", str(e))
        RequestErrorHandler.handle(e, context="Unexpected error during logout")


async def backchannel_logout(request: Request):

    try:
        claims = await validate_logout_token(request)
        sid = claims.get("sid")
        jti = claims.get("jti")  # JWT ID - unique identifier for the logout token
        logger.debug(f"Backchannel logout for sid: {sid}, jti: {jti}")

        # Ensure sid is present (it should be based on validation)
        if not sid:
            logger.error("Missing sid claim in logout token")
            raise ValueError("Missing sid claim in logout token")
        # Ensure jti is present (it should be based on validation)
        if not jti:
            logger.error("Missing jti claim in logout token")
            raise ValueError("Missing jti claim in logout token")

        # Check if this logout token has already been processed
        if await is_logout_processed(request, sid):
            logger.info(
                f"Logout token {sid} already processed, ignoring duplicate request"
            )
            return ResponseModel(
                success=True, data=None, message="Backchannel logout already processed"
            )

        # Try to get Redis client from the application state
        redis_client = get_redis_client(request)
        logger.info(f"Processing backchannel logout for sid: {sid}")
        # Delete the session from Redis for the given sid
        cache_key = f"{RedisKeys.REDIS_SESSION_KEY.value}{sid}"
        await redis_client.delete(cache_key)

        # Mark this logout token as processed to prevent duplicate processing
        await mark_session_logout(request, sid, source="backchannel_logout")

        return ResponseModel(
            success=True, data=None, message="Backchannel logout successful"
        )
    except ValueError as ve:
        logger.error(f"Value error during backchannel logout: {ve}")
        raise HTTPException(status_code=400, detail=str(ve)) from ve
    except Exception:
        logger.exception("Unexpected error during backchannel logout")
        # IBM Verify expects a 400 response for any error during backchannel logout
        raise HTTPException(
            status_code=400, detail="Internal error during backchannel logout"
        )
