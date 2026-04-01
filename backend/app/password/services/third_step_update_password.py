import logging
from datetime import datetime

from httpx import AsyncClient

from app.config import get_configuration
from app.password.schemas import (
    ThirdStepPasswordUpdatePayload,
    CompleteUpdatePasswordIbmApiResponse,
)
from app.users.services.get_my_profile import dispatch_get_my_profile_from_ibm
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def third_step_update_password(
    global_http_client: AsyncClient,
    session: dict,
    payload: ThirdStepPasswordUpdatePayload,
    user_access_token,
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    logger.info("Third step - attempting update password for")
    start_time = datetime.now()

    user_profile_response = await dispatch_get_my_profile_from_ibm(
        global_http_client, user_access_token
    )
    user_language = user_profile_response.preferredLanguage or "en"
    logger.info(f"Using user's preferred language: {user_language}")

    password_otp_response = await dispatch_update_password(
        global_http_client, payload, user_language
    )
    duration = (datetime.now() - start_time).total_seconds()
    logger.info(
        f"Third step - dispatch_password_reset_otp returned in {duration:.2f} seconds"
    )

    response_json = password_otp_response.json()

    completed_response = CompleteUpdatePasswordIbmApiResponse(**response_json)

    # Revoke and invalidate the session here

    return ResponseModel(
        success=True,
        data=completed_response,
        message="Password changed successfully",
    )


async def dispatch_update_password(
    global_http_client: AsyncClient,
    payload: ThirdStepPasswordUpdatePayload,
    language: str = None,
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    access_token = await get_admin_token(global_http_client)
    headers = get_auth_request_headers(access_token, True, language)
    settings = get_configuration()

    final_resetter_api_endpoint = (
        f"{settings.password_resetter_api_endpoint}/{payload.trxId}"
    )

    form_data = {"otp": payload.otp, "password": payload.password}

    logger.info("final step - invoking password resetter API endpoint")
    response = await global_http_client.put(
        final_resetter_api_endpoint, json=form_data, headers=headers
    )
    logger.info(
        f"returned response from final step resetter_api_endpoint: {response.json()}"
    )

    response.raise_for_status()
    logger.info("password_resetter_api_endpoint returned successfully")
    return response
