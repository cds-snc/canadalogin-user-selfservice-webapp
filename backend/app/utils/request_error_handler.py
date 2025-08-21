import logging
from fastapi import HTTPException
from httpx import HTTPStatusError, TimeoutException

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
            raise HTTPException(status_code=status, detail=f"{context} failed") from exc

        elif isinstance(exc, TimeoutException):
            logger.error("%s timed out", context)
            raise HTTPException(status_code=504, detail=f"{context} timed out") from exc

        elif isinstance(exc, ValidationError):
            logger.error("%s schema validation failed: %s", context, exc.errors())
            raise HTTPException(status_code=422, detail=f"Validation Error") from exc

        elif isinstance(exc, HTTPException):
            raise  # don’t swallow already-raised FastAPI errors

        else:
            logger.exception("Unexpected error during %s", context)
            raise HTTPException(status_code=500, detail=f"Unexpected {context} error") from exc
