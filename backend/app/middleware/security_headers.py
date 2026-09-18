from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.constants.session_keys import SessionKeys
from app.config import get_configuration

configuration = get_configuration()


def _build_content_security_policy() -> str:
    """Build CSP dynamically based on current environment to allow testing."""
    img_src = (
        "img-src 'self' data: http: https:; "
        if configuration.ENVIRONMENT == "local"
        else "img-src 'self' data: https:; "
    )
    return (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self'; "
        + img_src
        + "font-src 'self'; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "upgrade-insecure-requests"
    )


# Restrict browser execution and reduce attack surface by blocking most active content
# and disallowing embedding of this application in a frame.
CONTENT_SECURITY_POLICY = _build_content_security_policy()

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
    "X-Permitted-Cross-Domain-Policies": "none",
    "X-Robots-Tag": "noindex, nofollow",
    "X-XSS-Protection": "0",
}

# Force HTTPS for 1 year and include all subdomains; preload disabled to allow recovery from misconfiguration.
DEFAULT_STRICT_TRANSPORT_SECURITY = "max-age=31536000; includeSubDomains"

# Ensure caches vary based on the session cookie so authenticated responses are not reused.
AUTHENTICATED_VARY_HEADER = "Cookie"

# These session keys represent an active authenticated user session.
AUTHENTICATED_SESSION_KEYS = {
    SessionKeys.SESSION_USER_ACCESS_TOKEN_KEY.value,
    SessionKeys.SESSION_USER_TOKEN.value,
}


class SecurityHeadersMiddleware:
    def __init__(
        self,
        app: ASGIApp,
        *,
        headers: dict[str, str] | None = None,
        strict_transport_security: str = DEFAULT_STRICT_TRANSPORT_SECURITY,
        enable_hsts: bool = True,
    ) -> None:
        self.app = app
        # Rebuild default headers with current CSP to support environment changes in tests
        if headers is None:
            headers = DEFAULT_SECURITY_HEADERS.copy()
            headers["Content-Security-Policy"] = _build_content_security_policy()
        self.headers = headers
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

                # Remove Server header to prevent technology stack disclosure
                if "server" in headers:
                    del headers["server"]

                for header_name, header_value in self.headers.items():
                    if header_name not in headers:
                        headers[header_name] = header_value

                # Keep HSTS off in local development so browsers do not cache an
                # HTTPS-only policy for localhost and break HTTP-based dev flows.
                if self.enable_hsts and "Strict-Transport-Security" not in headers:
                    headers["Strict-Transport-Security"] = (
                        self.strict_transport_security
                    )

                # Default to no-store for all responses unless the endpoint explicitly sets Cache-Control
                # Prevent browsers from caching API responses containing sensitive data.
                if "Cache-Control" not in headers:
                    headers["Cache-Control"] = "no-store"

                if self._has_authenticated_session(scope):
                    headers.add_vary_header(AUTHENTICATED_VARY_HEADER)

            await send(message)

        await self.app(scope, receive, send_with_security_headers)
