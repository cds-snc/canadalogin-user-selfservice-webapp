import logging
from datetime import datetime

from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError

from app.config import get_configuration
from app.auth.schemas import FirstStepPasswordUpdate, FirstStepPasswordApiResponse, FirstStepPasswordResponse
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.helpers import (
    generate_error_response,
    prepare_pydantic_phone_number_for_verify,
    format_error_response,
)
from backend.app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def first_step_update_password(global_http_client: AsyncClient, data: FirstStepPasswordUpdate):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        logger.info(f"First step - attempting update password for: {data}")
        start_time = datetime.now()
        password_otp_response = await dispatch_password_otp(global_http_client, data)
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"First step - dispatch_password_reset_otp returned in {duration:.2f} seconds - {data}"
        )

        response_json = password_otp_response.json()

        try:
            validated_data = FirstStepPasswordApiResponse(**response_json)
        except ValidationError as validation_error:
            logger.warning("Invalid API response schema: %s", validation_error.errors())
            raise HTTPException(status_code=422, detail="Invalid response")

        client_data = FirstStepPasswordResponse(
            trxId=validated_data.trxId,
            stepsRemaining=validated_data.stepsRemaining,
            expiryTime=validated_data.nextStep.expiryTime,
            method=validated_data.nextStep.method
        )

        return ResponseModel(
            success=True,
            data=client_data,
            message=f"OTP sent successfully",
        )

    except Exception as e:
        logger.error("Failed first_step_update_password", exc_info=True)
        if isinstance(e, HTTPException):
            raise
        RequestErrorHandler.handle(e, context="First Step Password Update")


async def dispatch_password_otp(global_http_client: AsyncClient, payload: FirstStepPasswordUpdate):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_configuration()

        password_resetter_api_endpoint = settings.password_resetter_api_endpoint

        form_data = {
            "userName": payload.userName,
            "steps": [{"method": payload.otpMethod.value}]
        }
        logger.info(f"Form data for password reset: {password_resetter_api_endpoint} => {form_data}")
        response = await global_http_client.post(
            password_resetter_api_endpoint, json=form_data, headers=headers
        )
        logger.info(f"returned response from password_resetter_api_endpoint: {response.json()}")

        response.raise_for_status()
        logger.info("password_resetter_api_endpoint returned successfully")
        return response

    except Exception as e:
        logger.error(f"Error dispatch_password_reset_otp: {str(e)}", exc_info=True)
        RequestErrorHandler.handle(e)
