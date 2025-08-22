import logging
from fastapi import HTTPException
from httpx import HTTPStatusError, TimeoutException
from authlib.integrations.starlette_client import OAuthError
from pydantic import ValidationError

logger = logging.getLogger(__name__)


class RequestErrorHandler:
    """Reusable exception handler for token-related requests."""

    @staticmethod
    def handle(exc: Exception, context: str = "API request") -> None:
        if isinstance(exc, HTTPStatusError):
            status = exc.response.status_code if exc.response else 502
            url = str(exc.request.url) if exc.request else "unknown"
            logger.error("%s failed (status=%s, url=%s)", context, status, url)
            if status == 429:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "context": context,
                        "message": "Rate limit exceeded, please retry later.",
                    },
                ) from exc

            if status == 400:
                try:
                    body = exc.response.json()
                except ValueError:
                    body = {"messageDescription": exc.response.text}
                raise HTTPException(
                    status_code=400,
                    detail=body.get("messageDescription", "Bad request"),
                ) from exc
            if status == 401:
                raise OAuthError("Invalid or expired token")
            raise HTTPException(status_code=status, detail=f"{context} failed") from exc

        elif isinstance(exc, TimeoutException):
            logger.error("%s timed out", context)
            raise HTTPException(status_code=504, detail=f"{context} timed out") from exc

        elif isinstance(exc, ValidationError):
            logger.error("%s schema validation failed: %s", context, exc.errors())
            raise HTTPException(status_code=422, detail=f"Validation Error") from exc

        elif isinstance(exc, HTTPException):
            raise  # don’t swallow already-raised FastAPI errors

        elif isinstance(exc, OAuthError):
            raise

        else:
            logger.exception("Unexpected error during %s", context)
            raise HTTPException(
                status_code=500, detail=f"Unexpected {context} error"
            ) from exc
