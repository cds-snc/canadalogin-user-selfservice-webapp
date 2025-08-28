"""Session expiry cookie middleware for tracking session expiration client-side."""
import logging
import time
from starlette.datastructures import MutableHeaders
from starlette.requests import HTTPConnection
from starlette.types import ASGIApp, Message, Receive, Scope, Send
from app.config import get_configuration

logger = logging.getLogger(__name__)
config = get_configuration()

class SessionExpiryCookieMiddleware:
    """
    Middleware that sets a client-side readable cookie with session expiry information.
    
    This middleware:
    1. Checks if a session cookie exists in the request
    2. If session cookie exists, sets a new cookie (session-expiry) with the expiry time that's accessible via JavaScript
    3. Handles session deletion by clearing the expiry cookie when session is deleted
    """
    
    def __init__(
        self,
        app: ASGIApp,
        session_cookie_name: str | None = None,
        expiry_cookie_name: str | None = None,
    ) -> None:
        """Initialize the middleware with configurable cookie names."""
        self.app = app
        self.session_cookie_name = session_cookie_name or config.session_config.SESSION_COOKIE_NAME
        self.expiry_cookie_name = expiry_cookie_name or config.session_config.SESSION_EXPIRY_COOKIE_NAME
        self.session_lifetime = config.session_config.SESSION_LIFETIME
        logger.info(f"SessionExpiryCookieMiddleware initialized with session cookie: {self.session_cookie_name}, expiry cookie: {self.expiry_cookie_name}")
    
    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        """ASGI interface implementation."""
        if scope["type"] not in ("http", "websocket"):
            await self.app(scope, receive, send)
            return
        
        connection = HTTPConnection(scope)
        session_cookie_value = connection.cookies.get(self.session_cookie_name)
        
        async def send_wrapper(message: Message) -> None:
            if message["type"] != "http.response.start":
                await send(message)
                return
            
            headers = MutableHeaders(scope=message)
            
            if session_cookie_value:
                self._set_expiry_cookie(headers)
                logger.debug(f"Set {self.expiry_cookie_name} cookie with expiry timestamp") 
            else:
                self._clear_expiry_cookie(headers)
                logger.debug(f"Cleared {self.expiry_cookie_name} cookie as no session exists")
            
            await send(message)
        
        await self.app(scope, receive, send_wrapper)
    
    def _set_expiry_cookie(self, headers: MutableHeaders) -> None:
        """Set the expiry cookie with the current timestamp + session lifetime."""
        expiry_timestamp = int(time.time() + self.session_lifetime)
        
        header_parts = [
            f"{self.expiry_cookie_name}={expiry_timestamp}",
            f"max-age={self.session_lifetime}",
            "path=/",
            "samesite=lax"
        ]
        
        if config.session_config.SESSION_COOKIE_SECURE:
            header_parts.append("secure")
        
        if config.session_config.SESSION_COOKIE_DOMAIN:
            header_parts.append(f"domain={config.session_config.SESSION_COOKIE_DOMAIN}")
        
        # Note: httponly is intentionally NOT set to allow JavaScript access
        header_value = "; ".join(header_parts)
        headers.append("set-cookie", header_value)
    
    def _clear_expiry_cookie(self, headers: MutableHeaders) -> None:
        """Clear the expiry cookie by setting it to expire immediately."""
        header_parts = [
            f"{self.expiry_cookie_name}=''",
            "max-age=0",
            "path=/",
            "expires=Thu, 01 Jan 1970 00:00:00 GMT",
            "samesite=lax"
        ]
        
        if config.session_config.SESSION_COOKIE_SECURE:
            header_parts.append("secure")
        
        if config.session_config.SESSION_COOKIE_DOMAIN:
            header_parts.append(f"domain={config.session_config.SESSION_COOKIE_DOMAIN}")
        
        header_value = "; ".join(header_parts)
        headers.append("set-cookie", header_value)
