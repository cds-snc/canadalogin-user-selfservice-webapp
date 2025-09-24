import asyncio
import logging
import json
from datetime import datetime
from httpx import AsyncClient
from typing import AsyncGenerator

from fastapi import Request, HTTPException
from fastapi.responses import StreamingResponse
from starsessions.session import get_session_metadata
from authlib.integrations.starlette_client import OAuthError

from app.config import get_configuration
from app.constants.session_keys import SessionKeys
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.request_error_handler import RequestErrorHandler
from app.auth.services.oidc_config import oauth
from app.auth.schemas import SSEventData, KeepAliveData
from app.utils.schemas import ResponseModel


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


def set_rp_client_id_in_session(request: Request) -> None:
    if SessionKeys.RP_CLIENT_ID_KEY.value in request.query_params:
        rp_client_id = request.query_params[SessionKeys.RP_CLIENT_ID_KEY.value]
        request.session[SessionKeys.RP_CLIENT_ID_KEY.value] = rp_client_id
        logger.info(f"RP ClientID has been set: {rp_client_id}")


async def get_users_current_session(request: Request):
    """
    Session cookie contains an identifier for the user session.
    The user access token is stored in memory on the server
    Authlib docs - https://docs.authlib.org/en/latest/client/fastapi.html
    """

    set_rp_client_id_in_session(request)

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
        userinfo = user_token.get("userinfo")
        sid = userinfo.get("sid") if userinfo else None
        logger.info(f"User token refreshed and session updated. sid: {sid}")
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


async def get_session_data_by_id(request: Request, session_id: str):
    # Try to get Redis client from the application state
    session_data = None
    redis_client = getattr(request.app.state, "redis_client", None)
    logger.info(f"get session by sid: {session_id}")
    if redis_client is not None:
        # read the session from Redis for the given session_id
        cache_key = f"session:{session_id}"
        session = await redis_client.get(cache_key)
        session_data = session if session else None
    if session_data is None:
        logger.info(f"No session found for session_id: {session_id}")
        return None
    # Convert bytes to dict if necessary
    if isinstance(session_data, bytes):
        session_data = dict(json.loads(session_data.decode("utf-8")))
    return session_data


async def session_event_sse_generator(request: Request):
    """
    For code review. StreamingResponse, can't use regular Exception handling
    """
    config = get_configuration()
    user_info = None
    try:
        user_info = await get_user_info(request)
    except OAuthError as oe:
        logger.error(f"OAuth error while fetching user info: {str(oe)}")
        return StreamingResponse(
            [
                f"event: terminated\ndata: {SSEventData(status='error', error='Authentication error.').model_dump_json()}\n\n"
            ],
            media_type="text/event-stream",
            headers={
                "Access-Control-Allow-Origin": config.CORS_ORIGINS,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            },
        )

    sid = user_info.get("sid") if user_info else None
    if sid is None:
        logger.error("No sid found in user info")
        return StreamingResponse(
            [
                f"event: error\ndata: {SSEventData(status='error', error='No sid found').model_dump_json()}\n\n"
            ],
            media_type="text/event-stream",
            headers={
                "Access-Control-Allow-Origin": config.CORS_ORIGINS,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            },
        )

    async def event_stream(
        request: Request, session_id: str
    ) -> AsyncGenerator[str, None]:
        """
        Generate Server-Sent Events (SSE) for a user session.
        """
        try:
            while True:
                await asyncio.sleep(5)
                session_active = await get_session_data_by_id(request, session_id)
                if session_active is None:
                    logger.info("Session expired or not found")
                    message_data = SSEventData(status="expired")
                    yield f"event: expired\ndata: {message_data.model_dump_json()}\n\n"
                    break
                # Get session metadata
                session_metadata = get_session_metadata(request)
                last_access_timestamp = session_metadata.get("last_access")
                session_expire = (
                    config.session_config.SESSION_LIFETIME + last_access_timestamp - 30
                )

                # Prepare message data with optional last_access info
                message_data = SSEventData(status="active", expire=int(session_expire))
                yield f"event: notification\ndata: {message_data.model_dump_json()}\n\n"
        except asyncio.CancelledError:
            logger.info("SSE stream cancelled")
        except Exception as e:
            logger.error(f"Error in event stream: {str(e)}")
            message_data = SSEventData(
                status="error", error="An internal error has occurred."
            )
            yield f"event: error\ndata: {message_data.model_dump_json()}\n\n"

    return StreamingResponse(
        event_stream(request, sid),
        media_type="text/event-stream",
        headers={
            "Access-Control-Allow-Origin": config.CORS_ORIGINS,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


async def session_extend(request: Request):
    """
    Check session metadata for expiration. If session is older than 12 hours,
    remove it and return termination status with login URL.
    """
    config = get_configuration()
    # Get user info from current session
    user_info = await get_user_info(request)
    if user_info is None:
        session_status = KeepAliveData(status="non-authenticated", login="re-login")
        return ResponseModel(
            success=False, message="User not authenticated", data=session_status
        )
    # Get session ID from user info
    session_id = user_info.get("sid")
    if not session_id:
        session_status = KeepAliveData(status="non-authenticated", login="re-login")
        return ResponseModel(
            success=False, message="User not authenticated", data=session_status
        )

    # Get session metadata
    session_metadata = get_session_metadata(request)
    last_access_timestamp = session_metadata.get("last_access")
    created_timestamp = session_metadata.get("created")

    current_time = datetime.now().timestamp()
    twelve_hours_in_seconds = 12 * 60 * 60  # 43200 seconds

    session_expire = config.session_config.SESSION_LIFETIME + last_access_timestamp - 30

    # Check if session is older than 12 hours
    if current_time - created_timestamp > twelve_hours_in_seconds:
        # Session expired, remove it
        request.session.clear()

        session_status = KeepAliveData(status="terminated", login="re-login")
        return ResponseModel(
            success=False, message="Session terminated", data=session_status
        )

    # Session is valid, auto extend last access time
    session_status = KeepAliveData(status="active", expire=int(session_expire))
    return ResponseModel(success=True, message="Session is active", data=session_status)
