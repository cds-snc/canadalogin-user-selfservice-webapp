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

# Key used both as the session dict key for the server-side token and as the
# name of the cookie that mirrors it to the browser (kept as one constant since
# both must reference the same underlying token).
CSRF_TOKEN_KEY = "csrf_token"

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

    A random token is stored server-side in the user's session (persisted in
    Redis via `starsessions.stores.redis.RedisStore`, see `app/main.py`) and
    mirrored in a non-HttpOnly cookie. The SPA must echo the cookie value back
    via the `X-CSRF-Token` header on state-changing requests; requests where
    the header is missing or does not match the session-stored value are
    rejected.

    Two OWASP-recommended defense-in-depth layers run ahead of the token check:
    Fetch Metadata (`Sec-Fetch-Site`) and `Origin` verification. Neither replaces
    the token check; they only reject requests earlier/cheaper when a browser
    reports enough context to prove the request is cross-site or off-origin.

    Must run after session middleware has populated `scope["session"]`.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    def _fetch_metadata_rejection_reason(
        self, connection: HTTPConnection
    ) -> str | None:
        # Rejects requests only when Sec-Fetch-Site explicitly identifies them as
        # cross-site; the header's absence (older browsers, non-browser clients)
        # is not itself treated as suspicious and falls through to the token check.
        if connection.headers.get("sec-fetch-site") == "cross-site":
            return "Sec-Fetch-Site reported cross-site"
        return None

    def _origin_rejection_reason(self, connection: HTTPConnection) -> str | None:
        # Origin is absent on same-origin GET/HEAD navigations and some older
        # clients, so a missing header is allowed through to the token check
        # rather than rejected here; only a present-but-untrusted value is rejected.
        origin = connection.headers.get("origin")
        if origin is not None and origin not in configuration.cors_origins_list:
            return f"Origin header '{origin}' is not an allowed origin"
        return None

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        connection = HTTPConnection(scope)
        session = scope.get("session")
        token = None

        requires_csrf = (
            scope["method"] not in SAFE_METHODS
            and connection.url.path not in CSRF_EXEMPT_PATHS
        )

        if requires_csrf:
            rejection_reason = self._fetch_metadata_rejection_reason(
                connection
            ) or self._origin_rejection_reason(connection)
            if rejection_reason:
                logger.warning(
                    f"Rejected request to {connection.url.path}: {rejection_reason}"
                )
                response = JSONResponse(
                    {"detail": "CSRF token missing or invalid."},
                    status_code=403,
                )
                await response(scope, receive, send)
                return

        has_session = isinstance(session, dict)

        # Unsafe routes require a loaded session so the server-side token can be checked.
        if requires_csrf and not has_session:
            logger.warning(
                f"Rejected request to {connection.url.path} because no session is available for CSRF validation"
            )
            response = JSONResponse(
                {"detail": "CSRF token missing or invalid."},
                status_code=403,
            )
            await response(scope, receive, send)
            return

        # Safe and explicitly exempt requests do not need a session or CSRF cookie.
        if not has_session:
            await self.app(scope, receive, send)
            return

        # Validate the SPA-supplied token against the server-side session token.
        if requires_csrf:
            session_token = session.get(CSRF_TOKEN_KEY)
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

        # Create the token lazily so it is persisted in the session before the
        # response; `session[key] = token` writes through to Redis, not memory,
        # so the token survives restarts and is shared across app instances.
        token = session.get(CSRF_TOKEN_KEY)
        if not token:
            token = secrets.token_urlsafe(32)
            session[CSRF_TOKEN_KEY] = token

        async def send_with_csrf_cookie(message: Message) -> None:
            if message["type"] == "http.response.start" and token is not None:
                headers = MutableHeaders(scope=message)
                cookie_parts = [
                    f"{CSRF_TOKEN_KEY}={token}",
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
