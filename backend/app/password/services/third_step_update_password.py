import logging
from datetime import datetime

from fastapi import HTTPException, status
from httpx import AsyncClient
from pydantic import ValidationError

from app.config import get_configuration
from app.password.schemas import (
    ThirdStepPasswordUpdatePayload,
    CompleteUpdatePasswordIbmApiResponse,
)
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def third_step_update_password(
    global_http_client: AsyncClient,
    session: dict,
    payload: ThirdStepPasswordUpdatePayload,
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        logger.info("Third step - attempting update password for")
        start_time = datetime.now()
        password_otp_response = await dispatch_update_password(
            global_http_client, payload
        )
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"Third step - dispatch_password_reset_otp returned in {duration:.2f} seconds"
        )

        response_json = password_otp_response.json()

        try:
            completed_response = CompleteUpdatePasswordIbmApiResponse(**response_json)
        except ValidationError as validation_error:
            logger.warning("Invalid API response schema: %s", validation_error.errors())
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid API response schema",
            )

        # Revoke and invalidate the session here

        return ResponseModel(
            success=True,
            data=completed_response,
            message="Password changed successfully",
        )

    except Exception as e:
        logger.error("Failed second_step_update_password", exc_info=True)
        if isinstance(e, HTTPException):
            raise
        RequestErrorHandler.handle(e, context="Second Step Password Update")


async def dispatch_update_password(
    global_http_client: AsyncClient, payload: ThirdStepPasswordUpdatePayload
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_configuration()

        final_resetter_api_endpoint = (
            f"{settings.password_resetter_api_endpoint}/{payload.trxId}"
        )

        form_data = {"otp": payload.otp, "password": payload.password}

        logger.info(
            f"final step - resetter_api_endpoint: {final_resetter_api_endpoint}"
        )
        response = await global_http_client.put(
            final_resetter_api_endpoint, json=form_data, headers=headers
        )
        logger.info(
            f"returned response from final step resetter_api_endpoint: {response.json()}"
        )

        response.raise_for_status()
        logger.info("password_resetter_api_endpoint returned successfully")
        return response

    except Exception as e:
        logger.error(f"Error dispatch_password_reset_otp: {str(e)}", exc_info=True)
        if isinstance(e, HTTPException):
            raise
        RequestErrorHandler.handle(e, context="Third Step Password Update")
