import logging
from datetime import datetime

from httpx import AsyncClient

from app.config import get_configuration
from app.password.schemas import (
    FirstStepPasswordUpdatePayload,
    UpdatePasswordIbmApiResponse,
    UpdatePasswordClientResponsePayload,
)
from app.users.services.get_my_profile import dispatch_get_my_profile_from_ibm
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def first_step_update_password(
    global_http_client: AsyncClient,
    payload: FirstStepPasswordUpdatePayload,
    user_access_token,
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    logger.info("First step - attempting update password")
    start_time = datetime.now()

    # Get user's preferred language and unmasked username from their profile
    user_profile_response = await dispatch_get_my_profile_from_ibm(
        global_http_client, user_access_token
    )

    payload.userName = user_profile_response.userName
    user_language = user_profile_response.preferredLanguage or "en"
    logger.info(f"Using user's preferred language: {user_language}")

    password_otp_response = await dispatch_password_otp(
        global_http_client, payload, user_language
    )
    duration = (datetime.now() - start_time).total_seconds()
    logger.info(
        f"First step - dispatch_password_reset_otp returned in {duration:.2f} seconds"
    )

    response_json = password_otp_response.json()

    validated_data = UpdatePasswordIbmApiResponse(**response_json)

    client_data = UpdatePasswordClientResponsePayload(
        trxId=validated_data.trxId,
        stepsRemaining=validated_data.stepsRemaining,
        expiryTime=validated_data.nextStep.expiryTime,
        method=validated_data.nextStep.method,
    )

    return ResponseModel(
        success=True,
        data=client_data,
        message="OTP sent successfully",
    )


async def dispatch_password_otp(
    global_http_client: AsyncClient,
    payload: FirstStepPasswordUpdatePayload,
    language: str = None,
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    access_token = await get_admin_token(global_http_client)
    headers = get_auth_request_headers(access_token, True, language)
    settings = get_configuration()

    first_step_resetter_api_endpoint = settings.password_resetter_api_endpoint

    step_data = {"enrollmentId": payload.enrollmentId}

    form_data = {
        "userName": payload.userName,
        "steps": [
            {
                "method": payload.otpType.value,
                "data": step_data,
            }
        ],
    }
    logger.info("api endpoint for reset: calling configured password reset endpoint")
    response = await global_http_client.post(
        first_step_resetter_api_endpoint, json=form_data, headers=headers
    )
    logger.info(f"returned response from resetter_api_endpoint: {response.json()}")

    response.raise_for_status()
    logger.info("first_step_resetter_api_endpoint returned successfully")
    return response
