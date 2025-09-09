import logging
import jwt
from datetime import datetime
from httpx import AsyncClient

from fastapi import Request, HTTPException
from authlib.integrations.starlette_client import OAuthError
from starsessions.session import get_session_handler
from redis.exceptions import RedisError

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


def get_user_info(request: Request):
    user_info = request.session.get(SessionKeys.SESSION_USER_INFO.value)
    if not user_info:
        raise OAuthError("user info not found")
    return user_info


async def get_user_id_token(request: Request):
    """
    Get the id_token from the session, refreshing it if necessary.
    """
    id_token = request.session.get(SessionKeys.SESSION_USER_ID_TOKEN_KEY.value)

    if id_token is None:
        return None

    try:
        decoded_token = jwt.decode(id_token, options={"verify_signature": False})
        exp = decoded_token.get("exp")
        if (
            exp and exp < datetime.now().timestamp() + 60
        ):  # If token expires in 1 minute
            refresh_token = get_user_refresh_token(request)
            if not refresh_token:
                return None

            new_tokens = await refresh_id_token(refresh_token)
            if not new_tokens:
                return None

            userinfo = await oauth.verify.parse_id_token(new_tokens, None)
            new_tokens["userinfo"] = userinfo

            update_session_tokens(request, new_tokens)
            return new_tokens.get("id_token")
    except jwt.PyJWTError as e:
        logger.error(f"Error decoding token: {e}")
        return None

    return id_token


async def refresh_id_token(refresh_token: str):
    new_tokens = await oauth.verify.fetch_access_token(
        refresh_token=refresh_token, grant_type="refresh_token"
    )
    return new_tokens


def get_user_refresh_token(request: Request):
    return request.session.get(SessionKeys.SESSION_USER_REFRESH_TOKEN_KEY.value)


def update_session_tokens(request: Request, new_tokens: dict):
    """
    Update the session with new tokens.
    """
    request.session[SessionKeys.SESSION_USER_ACCESS_TOKEN_KEY.value] = new_tokens.get(
        "access_token"
    )
    request.session[SessionKeys.SESSION_USER_ID_TOKEN_KEY.value] = new_tokens.get(
        "id_token"
    )
    request.session[SessionKeys.SESSION_USER_REFRESH_TOKEN_KEY.value] = new_tokens.get(
        "refresh_token"
    )
    request.session[SessionKeys.SESSION_USER_INFO.value] = new_tokens.get("userinfo")


async def get_session_by_session_id(sessionid: str, request: Request):
    try:
        handler = get_session_handler(request)
        # use Redis read session data key = "session:{sessionid}"
        redis_key = f"session:{sessionid}"
        redis_client = request.app.state.redis_client
        data = await redis_client.get(redis_key)
        if not data:
            return None
        return handler.serializer.deserialize(data)
    except RedisError as e:
        logger.error(
            f"Redis error getting session {sessionid}: {str(e)}", exc_info=True
        )
        RequestErrorHandler.handle(e, context="Redis error getting session")


async def remove_session_by_session_id(sessionid: str, request: Request):
    try:
        handler = get_session_handler(request)
        if handler.session_id != sessionid:
            logger.warning(
                f"Session ID mismatch: handler session ID {handler.session_id} does not match provided session ID {sessionid}"
            )
            return
        # use Redis delete session data key = "session:{sessionid}"
        redis_key = f"session:{sessionid}"
        redis_client = request.app.state.redis_client
        await redis_client.delete(redis_key)
    except RedisError as e:
        logger.warning(
            f"Redis error removing session by ID {sessionid}: {str(e)}", exc_info=True
        )
        RequestErrorHandler.handle(e, context="remove server session")
