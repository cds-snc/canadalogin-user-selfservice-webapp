import logging
from datetime import datetime

from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError

from app.config import get_configuration
from app.password.schemas import (
    SecondStepPasswordUpdatePayload,
    UpdatePasswordIbmApiResponse,
    UpdatePasswordClientResponsePayload,
)
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def second_step_update_password(
    global_http_client: AsyncClient, payload: SecondStepPasswordUpdatePayload
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        logger.info(f"Second step - attempting update password for: {payload}")
        start_time = datetime.now()
        password_otp_response = await dispatch_password_otp_validator(
            global_http_client, payload
        )
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"Second step - dispatch_password_reset_otp returned in {duration:.2f} seconds - {payload}"
        )

        response_json = password_otp_response.json()

        try:
            validated_data = UpdatePasswordIbmApiResponse(**response_json)
        except ValidationError as validation_error:
            logger.warning("Invalid API response schema: %s", validation_error.errors())
            raise HTTPException(status_code=422, detail="Invalid API response schema")

        client_data = UpdatePasswordClientResponsePayload(
            trxId=validated_data.trxId,
            stepsRemaining=validated_data.stepsRemaining,
            method=validated_data.nextStep.method,
            userId=validated_data.userId,
        )

        return ResponseModel(
            success=True,
            data=client_data,
            message="OTP verified successfully",
        )

    except Exception as e:
        logger.error("Failed second_step_update_password", exc_info=True)
        if isinstance(e, HTTPException):
            raise
        RequestErrorHandler.handle(e, context="Second Step Password Update")


async def dispatch_password_otp_validator(
    global_http_client: AsyncClient, payload: SecondStepPasswordUpdatePayload
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_configuration()

        password_resetter_otp_api_endpoint = (
            f"{settings.password_resetter_api_endpoint}/{payload.trxId}/validator"
        )

        form_data = {
            "otp": payload.otp,
        }

        logger.info(
            f"Form data for password reset: {password_resetter_otp_api_endpoint} => {form_data}"
        )
        response = await global_http_client.post(
            password_resetter_otp_api_endpoint, json=form_data, headers=headers
        )
        logger.info(
            f"returned response from password_resetter_otp_api_endpoint: {response.json()}"
        )

        response.raise_for_status()
        logger.info("password_resetter_otp_api_endpoint returned successfully")
        return response

    except Exception as e:
        logger.error(f"Error dispatch_password_reset_otp: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e, context="Second Step Password Update")
