import logging
from fastapi import HTTPException, status
from httpx import HTTPStatusError, TimeoutException
from authlib.integrations.starlette_client import OAuthError
from pydantic import ValidationError

logger = logging.getLogger(__name__)


class RequestErrorHandler:
    """Reusable exception handler for token-related requests."""

    @staticmethod
    def extract_response_body(response):
        try:
            return response.json()
        except ValueError:
            return {"messageId": response.text}

    @staticmethod
    def handle(exc: Exception, context: str = "API request") -> None:
        if isinstance(exc, HTTPStatusError):
            response_status_code = (
                exc.response.status_code
                if exc.response
                else status.HTTP_502_BAD_GATEWAY
            )
            url = str(exc.request.url) if exc.request else "unknown"
            logger.error(
                "%s failed (status=%s, url=%s)", context, response_status_code, url
            )
            if response_status_code in [
                status.HTTP_429_TOO_MANY_REQUESTS,
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_404_NOT_FOUND,
            ]:
                body = RequestErrorHandler.extract_response_body(exc.response)

                logger.error(
                    "%s failed (status=%s, url=%s, messageId=%s, message=%s, detail=%s)",
                    context,
                    response_status_code,
                    url,
                    body.get("messageId", "N/A"),
                    body.get("message", "N/A"),
                    body.get("detail", "N/A"),
                )

                if response_status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=body.get("messageId", "Too many requests"),
                    ) from exc
                else:  # HTTP_400_BAD_REQUEST
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=body.get("messageId", "Bad request"),
                    ) from exc

            if response_status_code == status.HTTP_401_UNAUTHORIZED:
                raise OAuthError("Invalid or expired token")
            raise HTTPException(
                status_code=response_status_code, detail=f"{context} failed"
            ) from exc

        elif isinstance(exc, TimeoutException):
            logger.error("%s timed out", context)
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"{context} timed out",
            ) from exc

        elif isinstance(exc, ValidationError):
            logger.error("%s schema validation failed: %s", context, exc.errors())
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Validation Error",
            ) from exc

        elif isinstance(exc, HTTPException):
            raise  # don’t swallow already-raised FastAPI errors

        elif isinstance(exc, OAuthError):
            raise

        else:
            logger.exception("Unexpected error during %s", context)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected {context} error",
            ) from exc
