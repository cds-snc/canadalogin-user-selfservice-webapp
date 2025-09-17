import logging
from datetime import datetime
from httpx import AsyncClient

from fastapi import Request, HTTPException
from authlib.integrations.starlette_client import OAuthError

from app.config import get_configuration
from app.constants.session_keys import SessionKeys
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.request_error_handler import RequestErrorHandler
from app.auth.services.oidc_config import oauth

logger = logging.getLogger(__name__)


async def get_http_client(request: Request) -> AsyncClient:
    return request.app.state.request_client


async def introspect_user_token(
    global_http_client: AsyncClient, user_access_token: str
):

    try:
        admin_access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(admin_access_token, True)
        headers["Content-Type"] = "application/x-www-form-urlencoded"
        settings = get_configuration()

        form_data = {
            "token": user_access_token,
            "client_id": settings.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_API_CLIENT_ID,
            "client_secret": settings.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_API_SECRET,
        }

        introspect_token_api_endpoint = settings.introspect_token_api_endpoint
        response = await global_http_client.post(
            introspect_token_api_endpoint, data=form_data, headers=headers
        )

        response.raise_for_status()
        response_json = response.json()
        logger.info(
            f"returned response from introspect_token_api_endpoint: {response_json}"
        )
        return response_json
    except Exception as e:
        logger.error(f"Error introspect_user_token: {str(e)}", exc_info=True)
        if isinstance(e, HTTPException):
            raise
        RequestErrorHandler.handle(e, context="introspect_user_token")


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
        logger.info("Not authenticated - no user access token found")
        raise OAuthError("user access token not found")
    logger.info("Access Token found in session")
    http_client = await get_http_client(request)
    validate_user_token_response = await introspect_user_token(
        http_client, user_access_token
    )
    data = validate_user_token_response
    if not data.get("active"):
        request.session.clear()
        raise OAuthError("Invalid or expired token")
    return user_access_token


async def ensure_user_token(request: Request):
    """
    Ensure the user token is valid and refresh if necessary.
    """
    user_token = request.session.get(SessionKeys.SESSION_USER_TOKEN.value)
    if not user_token:
        logger.info("Not authenticated - no user token found")
        raise OAuthError("user token not found")
    expire_time = user_token.get("expires_at")
    if (
        expire_time and datetime.now().timestamp() > expire_time - 120
    ):  # 2 minutes buffer
        refresh_token = user_token.get("refresh_token")
        if not refresh_token:
            raise OAuthError("user token has expired")
        user_token = await refresh_token(refresh_token)
        update_session_tokens(request, user_token)
        logger.info(
            f"User token refreshed and session updated. sid: {user_token.get('userinfo').get('sid')}"
        )
    return user_token


async def get_user_info(request: Request):
    token = await ensure_user_token(request)
    return token.get("userinfo")


async def get_user_access_token(request: Request):
    token = await ensure_user_token(request)
    return token.get("access_token")


async def get_user_id_token(request: Request):
    token = await ensure_user_token(request)
    return token.get("id_token")


async def get_user_refresh_token(request: Request):
    token = await ensure_user_token(request)
    return token.get("refresh_token")


async def refresh_token(refresh_token: str):
    try:
        new_tokens = await oauth.verify.fetch_access_token(
            refresh_token=refresh_token, grant_type="refresh_token"
        )
        return new_tokens
    except Exception as e:
        logger.error(f"Error refreshing ID token: {str(e)}", exc_info=True)
        raise OAuthError("get new token has failed")


def update_session_tokens(request: Request, new_tokens: dict):
    """
    Update the session with new tokens.
    """
    request.session[SessionKeys.SESSION_USER_ACCESS_TOKEN_KEY.value] = new_tokens.get(
        "access_token"
    )
    request.session[SessionKeys.SESSION_USER_TOKEN.value] = new_tokens


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
        expiration_seconds: How long to remember this token (default: 24 hours)
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
