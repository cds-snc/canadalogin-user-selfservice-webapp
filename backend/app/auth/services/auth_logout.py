import logging
from fastapi import Request
from authlib.jose import jwt
from authlib.jose.errors import JoseError
from authlib.jose.rfc7519.jwt import create_load_key
from app.auth.services.oidc_config import oauth

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


async def is_logout_token_processed(request: Request, jti: str) -> bool:
    """
    Check if a logout token (identified by jti) has already been processed.

    Args:
        request: FastAPI request object
        jti: JWT ID from the logout token

    Returns:
        bool: True if the token has already been processed, False otherwise
    """
    if not jti:
        return False

    # Try to get Redis client from the application state
    redis_client = getattr(request.app.state, "redis_client", None)

    if redis_client is not None:
        # Use Redis to check if token was processed
        cache_key = f"processed_logout_token:{jti}"
        result = await redis_client.get(cache_key)
        return result is not None
    else:
        # Fallback to in-memory storage (not recommended for production)
        # This is for local development or when Redis is not available
        if not hasattr(request.app.state, "processed_logout_tokens"):
            request.app.state.processed_logout_tokens = set()
        return jti in request.app.state.processed_logout_tokens


async def mark_logout_token_as_processed(
    request: Request, jti: str, expiration_seconds: int = 1800
):
    """
    Mark a logout token (identified by jti) as processed to prevent duplicate processing.

    Args:
        request: FastAPI request object
        jti: JWT ID from the logout token
        expiration_seconds: How long to remember this token (default: 30 minutes)
    """
    if not jti:
        return

    # Try to get Redis client from the application state
    redis_client = getattr(request.app.state, "redis_client", None)

    if redis_client is not None:
        # Use Redis to store the processed token with expiration
        cache_key = f"processed_logout_token:{jti}"
        await redis_client.setex(cache_key, expiration_seconds, "processed")
        logger.debug(
            f"Marked logout token {jti} as processed in Redis with {expiration_seconds}s expiration"
        )
    else:
        # Fallback to in-memory storage (not recommended for production)
        # This is for local development or when Redis is not available
        if not hasattr(request.app.state, "processed_logout_tokens"):
            request.app.state.processed_logout_tokens = set()
        request.app.state.processed_logout_tokens.add(jti)
        logger.debug(f"Marked logout token {jti} as processed in memory (fallback)")

        # Note: In-memory storage doesn't have automatic expiration
        # In production, always use Redis or another persistent cache
