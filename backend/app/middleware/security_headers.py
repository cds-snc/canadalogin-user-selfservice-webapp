from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.constants.session_keys import SessionKeys

# Restrict browser execution and reduce attack surface by blocking most active content
# and disallowing embedding of this application in a frame.
CONTENT_SECURITY_POLICY = (
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
)

# Helps isolate this site from cross-origin opener attacks by limiting window access.
CROSS_ORIGIN_OPENER_POLICY = "same-origin"

# Prevents cross-origin resource sharing for the browser when fetching site assets.
CROSS_ORIGIN_RESOURCE_POLICY = "same-site"

# Disable risky browser features that are not required by the application.
PERMISSIONS_POLICY = (
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), "
    "microphone=(), payment=(), usb=()"
)

# Limits the referrer information shared with other sites to the origin when possible.
REFERRER_POLICY = "strict-origin-when-cross-origin"

# Stops browsers from sniffing a response away from the declared content type.
X_CONTENT_TYPE_OPTIONS = "nosniff"

# Disables DNS prefetching to reduce unsolicited network requests from the browser.
X_DNS_PREFETCH_CONTROL = "off"

# Prevents the site from being rendered inside a frame or iframe.
X_FRAME_OPTIONS = "DENY"

DEFAULT_SECURITY_HEADERS = {
    "Content-Security-Policy": CONTENT_SECURITY_POLICY,
    "Cross-Origin-Opener-Policy": CROSS_ORIGIN_OPENER_POLICY,
    "Cross-Origin-Resource-Policy": CROSS_ORIGIN_RESOURCE_POLICY,
    "Permissions-Policy": PERMISSIONS_POLICY,
    "Referrer-Policy": REFERRER_POLICY,
    "X-Content-Type-Options": X_CONTENT_TYPE_OPTIONS,
    "X-DNS-Prefetch-Control": X_DNS_PREFETCH_CONTROL,
    "X-Frame-Options": X_FRAME_OPTIONS,
    "X-Robots-Tag": "noindex, nofollow",
    "X-XSS-Protection": "0",
}

# Force HTTPS for a full year and include all subdomains; only enabled outside local dev.
DEFAULT_STRICT_TRANSPORT_SECURITY = "max-age=63072000; includeSubDomains; preload"

# Prevent browsers from caching authenticated API responses containing sensitive data.
AUTHENTICATED_CACHE_CONTROL = "no-store"

# Ensure caches vary based on the session cookie so authenticated responses are not reused.
AUTHENTICATED_VARY_HEADER = "Cookie"

# These session keys represent an active authenticated user session.
AUTHENTICATED_SESSION_KEYS = {
    SessionKeys.SESSION_USER_ACCESS_TOKEN_KEY.value,
    SessionKeys.SESSION_USER_TOKEN.value,
}


class SecurityHeadersMiddleware:
    _DOCS_PATHS = {"/docs", "/redoc", "/openapi.json"}

    def __init__(
        self,
        app: ASGIApp,
        *,
        headers: dict[str, str] | None = None,
        strict_transport_security: str = DEFAULT_STRICT_TRANSPORT_SECURITY,
        enable_hsts: bool = True,
    ) -> None:
        self.app = app
        self.headers = headers or DEFAULT_SECURITY_HEADERS
        self.strict_transport_security = strict_transport_security
        self.enable_hsts = enable_hsts

    @staticmethod
    def _has_authenticated_session(scope: Scope) -> bool:
        session = scope.get("session")
        if not isinstance(session, dict):
            return False

        return any(
            session.get(session_key) for session_key in AUTHENTICATED_SESSION_KEYS
        )

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path")

        async def send_with_security_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)

                for header_name, header_value in self.headers.items():
                    if (
                        path in self._DOCS_PATHS
                        and header_name == "Content-Security-Policy"
                    ):
                        continue

                    if header_name not in headers:
                        headers[header_name] = header_value

                # Keep HSTS off in local development so browsers do not cache an
                # HTTPS-only policy for localhost and break HTTP-based dev flows.
                if self.enable_hsts and "Strict-Transport-Security" not in headers:
                    headers["Strict-Transport-Security"] = (
                        self.strict_transport_security
                    )

                if self._has_authenticated_session(scope):
                    cache_control = headers.get("Cache-Control")
                    if cache_control is None:
                        headers["Cache-Control"] = AUTHENTICATED_CACHE_CONTROL
                    elif AUTHENTICATED_CACHE_CONTROL not in {
                        directive.strip().lower()
                        for directive in cache_control.split(",")
                    }:
                        headers["Cache-Control"] = (
                            f"{cache_control}, {AUTHENTICATED_CACHE_CONTROL}"
                        )
                    headers.add_vary_header(AUTHENTICATED_VARY_HEADER)

            await send(message)

        await self.app(scope, receive, send_with_security_headers)
