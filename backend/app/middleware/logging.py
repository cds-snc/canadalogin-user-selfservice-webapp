from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from urllib.parse import urlencode
from app.auth.services.auth_user_session import get_user_info
from authlib.integrations.starlette_client import OAuthError
from datetime import datetime

import logging
import hashlib
import json

logger = logging.getLogger(__name__)
logger.setLevel(logging.WARNING)

PROJECT_NAME = "GCAuth"
APPLICATION_NAME = "SelfService"
QUERY_STRING_BLACKLIST = ["secret", "token"]


class LoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)

    def hash_blacklisted_params(self, query_params) -> str:
        """
        Takes a dictionary of parameters, hashes blacklisted values,
        and returns a clean query string.
        """
        processed = {}

        for key, value in query_params.items():
            if key in QUERY_STRING_BLACKLIST and value:
                # Hash the value
                processed[key] = hashlib.sha256(str(value).encode("utf-8")).hexdigest()
            else:
                processed[key] = value

        return urlencode(processed)

    async def build_context(self, request, response):
        context = {
            "user": await self.build_user(request),
            "request": self.build_request(request),
            "response": self.build_response(response),
            "endpoint": self.build_endpoint(request),
        }

        # Only include keys where the value is truthy
        return {k: v for k, v in context.items() if v}

    async def build_user(self, request):
        try:
            user_info = await get_user_info(request)
            return {
                "id": hashlib.sha256(
                    str(user_info.get("sub")).encode("utf-8")
                ).hexdigest(),
                "auth_methods": user_info.get("amr"),
            }
        except OAuthError:
            return None

    def build_request(self, request):
        return {
            "method": request.method,
            "path": request.url.path,
            "query_string": self.hash_blacklisted_params(request.query_params),
        }

    def build_response(self, response):
        return {"status_code": response.status_code}

    def build_endpoint(self, request):
        endpoint = request.scope.get("endpoint")
        if endpoint:
            return {
                "file_name": endpoint.__code__.co_filename,
                "line_number": endpoint.__code__.co_firstlineno,
                "module_name": endpoint.__module__,
                "function_name": endpoint.__name__,
            }
        return None

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
        except Exception as exc:
            # Log unhandled exceptions (500 errors)
            logger.error(f"Unhandled exception: {exc} | Path: {request.url.path}")
            raise

        context = await self.build_context(request, response)
        # Get response status
        log_level = logging.INFO
        level = "INFO"

        if response.status_code >= 400 and response.status_code < 500:
            log_level = logging.WARNING
            level = "WARNING"
        elif response.status_code >= 500:
            log_level = logging.ERROR
            level = "ERROR"

        if response.status_code >= 400:
            logger.log(
                log_level,
                json.dumps(
                    {
                        "code": f"{PROJECT_NAME}.{APPLICATION_NAME}.{level}.{response.status_code}",
                        "level": level,
                        "context": context,
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    }
                ),
            )

        return response
