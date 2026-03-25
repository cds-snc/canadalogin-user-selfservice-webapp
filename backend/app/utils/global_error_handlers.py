from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse

from fastapi.exceptions import RequestValidationError
from httpx import HTTPStatusError, TimeoutException
from authlib.integrations.starlette_client import OAuthError
from pydantic import ValidationError

from app.utils.standardized_logging import StandardizedLogging
from app.auth.services.auth import redirect_user_to_idp_verify

import logging
import uuid

logger = logging.getLogger(__name__)
logger.setLevel(logging.ERROR)

standard_logger = StandardizedLogging()


def extract_response_body(response):
    try:
        return response.json()
    except ValueError:
        return {"messageId": response.text}


async def http_exception_handler(request: Request, exc: HTTPException):
    correlation_id = str(uuid.uuid4())
    logger.exception(
        f"Correlation ID: {correlation_id} - The request could not be completed."
    )

    response = JSONResponse(
        status_code=exc.status_code,
        content={
            "correlation_id": correlation_id,
            "success": False,
            "message": exc.detail,
        },
    )

    return await standard_logger.log(request, response)


async def oauth_error_handler(request: Request, exc: OAuthError):
    correlation_id = str(uuid.uuid4())
    status_code = getattr(exc, "status_code", status.HTTP_401_UNAUTHORIZED)

    logger.exception(
        f"Correlation ID: {correlation_id} - Authentication failed. Please try again."
    )

    if "text/html" in request.headers.get("accept", ""):
        try:
            return await redirect_user_to_idp_verify(request)
        except Exception as e:
            return await generic_exception_handler(request, e)

    response = JSONResponse(
        status_code=status_code,
        content={
            "correlation_id": correlation_id,
            "success": False,
            "message": "Authentication failed. Please try again.",
        },
    )

    return await standard_logger.log(request, response)


async def http_status_error_handler(request: Request, exc: HTTPStatusError):
    correlation_id = str(uuid.uuid4())
    status_code = (
        exc.response.status_code if exc.response else status.HTTP_502_BAD_GATEWAY
    )
    url = str(exc.request.url) if exc.request else "unknown"

    message = (
        f"Upstream service returned the following HTTP status code: {status_code}.",
    )

    if status_code in [
        status.HTTP_429_TOO_MANY_REQUESTS,
        status.HTTP_400_BAD_REQUEST,
        status.HTTP_404_NOT_FOUND,
    ]:
        body = extract_response_body(exc.response)
        message = body.get("messageId", "N/A")
        logger.exception(
            f"Correlation ID: {correlation_id} - Upstream service returned an error (status={status_code}, url={url}, messageId={body.get('messageId', 'N/A')}, message={body.get('message', 'N/A')}, detail={body.get('detail', 'N/A')})"
        )
    else:
        logger.exception(
            f"Correlation ID: {correlation_id} - Upstream service returned an error (status={status_code}, url={url})"
        )

    response = JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={
            "correlation_id": correlation_id,
            "success": False,
            "message": message,
        },
    )

    return await standard_logger.log(request, response)


async def timeout_error_handler(request: Request, exc: TimeoutException):
    correlation_id = str(uuid.uuid4())
    logger.exception(f"Correlation ID: {correlation_id} - Upstream request timed out.")
    response = JSONResponse(
        status_code=status.HTTP_504_GATEWAY_TIMEOUT,
        content={
            "correlation_id": correlation_id,
            "success": False,
            "message": "Upstream request timed out.",
        },
    )
    return await standard_logger.log(request, response)


async def request_validation_error_handler(
    request: Request, exc: RequestValidationError
):
    correlation_id = str(uuid.uuid4())
    logger.exception(
        f"Correlation ID: {correlation_id} - The provided data is not valid: {exc.errors()}"
    )
    response = JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={
            "correlation_id": correlation_id,
            "success": False,
            "message": "The provided data is not valid.",
        },
    )
    return await standard_logger.log(request, response)


async def validation_error_handler(request: Request, exc: ValidationError):
    correlation_id = str(uuid.uuid4())
    logger.exception(
        f"Correlation ID: {correlation_id} - The provided data is not valid: {exc.errors()}"
    )
    response = JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={
            "correlation_id": correlation_id,
            "success": False,
            "message": "The provided data is not valid.",
        },
    )
    return await standard_logger.log(request, response)


async def generic_exception_handler(request: Request, exc: Exception):
    correlation_id = str(uuid.uuid4())
    logger.exception(
        f"Correlation ID: {correlation_id} - An unexpected error occurred."
    )
    response = JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "correlation_id": correlation_id,
            "success": False,
            "message": "An unexpected error occurred.",
        },
    )
    return await standard_logger.log(request, response)
