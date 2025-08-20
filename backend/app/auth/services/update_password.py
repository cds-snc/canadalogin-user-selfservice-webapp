import logging
from datetime import datetime

from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError

from app.config import get_configuration
from app.auth.schemas import FirstStepPasswordUpdate
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.helpers import (
    generate_error_response,
    prepare_pydantic_phone_number_for_verify,
    format_error_response,
)
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def first_step_update_password(global_http_client: AsyncClient, data: FirstStepPasswordUpdate):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        logger.info(f"First step - attempting update password for: {data}")
        start_time = datetime.now()
        http_client_response = await dispatch_password_reset_otp(global_http_client, data)
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"First step - dispatch_password_reset_otp returned in {duration:.2f} seconds - {data}"
        )

        if http_client_response.status_code is None:
            return generate_error_response(400, "Unknown error")

        if http_client_response.status_code != 201:
            logger.error(
                f"Error while sending {data} OTP: {http_client_response.json()}"
            )
            return generate_error_response(
                http_client_response.status_code,
                format_error_response(http_client_response.json()),
            )

        response_json = http_client_response.json()

        if http_client_response.status_code == 201:
            logger.info(f"{data} OTP created and sent")

            # try:
            #     validated_data = OtpDataResponse(**response_json)

            # except ValidationError as e:
            #     logger.error(f"Validation Error: {e.json()}")
            #     return generate_error_response(422, "Server Error")

            # return ResponseModel(
            #     success=True,
            #     data=validated_data,
            #     message=f"{user_otp_info.otpType} OTP sent successfully",
            # )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Send transient {data} error: {str(e)}",
        )


async def dispatch_password_reset_otp(global_http_client: AsyncClient, data: FirstStepPasswordUpdate):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""

    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_configuration().ibm_verify_config

        # if user_otp_info.otpType == OtpType.SMS:
        #     send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/transient/verifications"
        #     response = await global_http_client.post(
        #         send_transient_otp_url, json=user_phone_number, headers=headers
        #     )
        #     return response

        # elif user_otp_info.otpType == OtpType.VOICE:
        #     send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/transient/verifications"
        #     response = await global_http_client.post(
        #         send_transient_otp_url, json=user_phone_number, headers=headers
        #     )
        #     return response

        # elif user_otp_info.userName and user_otp_info.otpType == OtpType.EMAIL:
        #     user_email_address = {"emailAddress": user_otp_info.userName}
        #     send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications"
        #     response = await global_http_client.post(
        #         send_transient_otp_url, json=user_email_address, headers=headers
        #     )
        #     return response

        # else:
        #     generate_error_response(400, "Unknown error")

    except HTTPException as error:
        logger.error(f"HTTP Exception resetting users password: {data}: Error: {str(error)}")
        raise error
    except Exception as error:
        logger.error(f"HTTP Exception resetting users password: {data}: Error: {str(error)}", exc_info=True,)
        return generate_error_response(500, "Unknown error")
