import logging
from datetime import datetime

from httpx import AsyncClient
from httpx import HTTPStatusError
from fastapi import HTTPException, status

from app.config import get_configuration
from app.password.schemas import (
    SecondStepPasswordUpdatePayload,
    UpdatePasswordIbmApiResponse,
    UpdatePasswordClientResponsePayload,
)
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.global_error_handlers import extract_response_body
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def second_step_update_password(
    global_http_client: AsyncClient,
    payload: SecondStepPasswordUpdatePayload,
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

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

    validated_data = UpdatePasswordIbmApiResponse(**response_json)

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


async def dispatch_password_otp_validator(
    global_http_client: AsyncClient,
    payload: SecondStepPasswordUpdatePayload,
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    access_token = await get_admin_token(global_http_client)
    headers = get_auth_request_headers(access_token, True)
    settings = get_configuration()

    resetter_otp_validator_api_endpoint = (
        f"{settings.password_resetter_api_endpoint}/{payload.trxId}/validator"
    )

    form_data = {
        "otp": payload.otp,
    }

    logger.info("dispatch_otp_validator: sending OTP validation request")
    response = await global_http_client.post(
        resetter_otp_validator_api_endpoint, json=form_data, headers=headers
    )
    logger.info(f"returned response from resetter_otp_api_endpoint: {response.json()}")

    try:
        response.raise_for_status()
    except HTTPStatusError as exc:
        if exc.response and exc.response.status_code == status.HTTP_400_BAD_REQUEST:
            body = extract_response_body(exc.response)
            detail = {
                "message": body.get("messageId", "Bad request"),
            }
            if body.get("attempts") is not None:
                detail["attempts"] = body.get("attempts")
            if body.get("retries") is not None:
                detail["retries"] = body.get("retries")

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=detail,
            ) from exc
        raise

    logger.info("resetter_otp_api_endpoint returned successfully")
    return response
