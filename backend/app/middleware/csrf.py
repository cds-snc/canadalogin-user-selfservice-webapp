import hmac
import logging
import secrets

from starlette.datastructures import MutableHeaders
from starlette.requests import HTTPConnection
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.config import get_configuration

logger = logging.getLogger(__name__)

configuration = get_configuration()

# Session key used to store the per-session CSRF token server-side.
CSRF_SESSION_KEY = "csrf_token"

# Cookie exposing the token to JavaScript so the SPA can echo it back in a header.
CSRF_COOKIE_NAME = "csrf_token"

# Header the SPA must send on state-changing requests; value must match the session token.
CSRF_HEADER_NAME = "X-CSRF-Token"

# Methods that cannot mutate state and therefore do not require CSRF validation.
SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}

# Routes called server-to-server (no browser session/cookie present) are exempt.
CSRF_EXEMPT_PATHS = {
    f"{configuration.V1_API_VERSION}/auth/backchannel-logout",
}


class CSRFMiddleware:
    """Synchronizer-token CSRF protection.

    A random token is stored server-side in the user's session and mirrored in a
    non-HttpOnly cookie. The SPA must echo the cookie value back via the
    `X-CSRF-Token` header on state-changing requests; requests where the header is
    missing or does not match the session-stored value are rejected.

    Must run after session middleware has populated `scope["session"]`.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        connection = HTTPConnection(scope)
        session = scope.get("session")
        token = None

        if isinstance(session, dict):
            if (
                scope["method"] not in SAFE_METHODS
                and connection.url.path not in CSRF_EXEMPT_PATHS
            ):
                session_token = session.get(CSRF_SESSION_KEY)
                request_token = connection.headers.get(CSRF_HEADER_NAME)
                if (
                    not session_token
                    or not request_token
                    or not hmac.compare_digest(session_token, request_token)
                ):
                    logger.warning(
                        f"Rejected request to {connection.url.path} with missing or invalid CSRF token"
                    )
                    response = JSONResponse(
                        {"detail": "CSRF token missing or invalid."},
                        status_code=403,
                    )
                    await response(scope, receive, send)
                    return

            token = session.get(CSRF_SESSION_KEY)
            if not token:
                token = secrets.token_urlsafe(32)
                session[CSRF_SESSION_KEY] = token

        async def send_with_csrf_cookie(message: Message) -> None:
            if message["type"] == "http.response.start" and token is not None:
                headers = MutableHeaders(scope=message)
                cookie_parts = [
                    f"{CSRF_COOKIE_NAME}={token}",
                    "path=/",
                    f"max-age={configuration.session_config.SESSION_LIFETIME}",
                    "samesite=lax",
                ]
                if configuration.ENVIRONMENT != "local":
                    cookie_parts.append("secure")
                if configuration.ROOT_DOMAIN:
                    cookie_parts.append(f"domain={configuration.ROOT_DOMAIN}")
                headers.append("set-cookie", "; ".join(cookie_parts))
            await send(message)

        await self.app(scope, receive, send_with_csrf_cookie)
