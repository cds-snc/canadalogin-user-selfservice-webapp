import logging
from datetime import datetime

from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError

from app.config import get_configuration
from app.otp.schemas import RetrievalData, OtpDataResponse, OtpType
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.helpers import generate_error_response
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def handle_otp_status_retrieval(
    retrieval_data: RetrievalData, global_http_client: AsyncClient
):
    try:
        logger.info(f"Attempting to retrieve {retrieval_data.otpType} OTP.")
        start_time = datetime.now()
        http_client_response = await dispatch_otp_status_retrieval(
            retrieval_data, global_http_client
        )
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"{retrieval_data.otpType} OTP retrieval request response received in {duration:.2f} seconds"
        )

        if http_client_response.status_code is None:
            return generate_error_response(400, "Unknown error")

        if http_client_response.status_code != 200:
            logger.error(
                f"Error while retrieving {retrieval_data.otpType} OTP: {http_client_response.json()}"
            )
            return generate_error_response(
                http_client_response.status_code, str(http_client_response.json())
            )

        response_json = http_client_response.json()

        if http_client_response.status_code == 200:

            try:
                validated_data = OtpDataResponse(**response_json)

            except ValidationError as e:
                logger.error(f"Validation Error: {e.json()}")
                return generate_error_response(422, "Server Error")

            return ResponseModel(
                success=True,
                data=validated_data,
                message=f"{retrieval_data.otpType} OTP status checked successfully",
            )

    except Exception as e:
        raise HTTPException(
            status_code=405,
            detail=f"Verify transient {retrieval_data.otpType} error: {str(e)}",
        )


async def dispatch_otp_status_retrieval(
    retrieval_data: RetrievalData, global_http_client: AsyncClient
):
    try:
        access_token = await get_admin_token()
        headers = get_auth_request_headers(access_token, True)
        settings = get_configuration().ibm_verify_config

        if retrieval_data.otpType == OtpType.SMS:
            send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/transient/verifications/{retrieval_data.trxnId}"
            response = await global_http_client.get(
                send_transient_otp_url, headers=headers
            )
            return response

        elif retrieval_data.otpType == OtpType.VOICE:
            send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/transient/verifications/{retrieval_data.trxnId}"
            response = await global_http_client.get(
                send_transient_otp_url, headers=headers
            )
            return response

        elif retrieval_data.otpType == OtpType.EMAIL:
            send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications/{retrieval_data.trxnId}"
            response = await global_http_client.get(
                send_transient_otp_url, headers=headers
            )
            return response

        else:
            generate_error_response(400, "Unknown error")

    except HTTPException as he:
        logger.error(
            f"HTTP Exception in {retrieval_data.otpType} OTP status check: {str(he)}"
        )
        raise he
    except Exception as error:
        logger.error(
            f"Request to: /v2.0/factors/{retrieval_data.otpType}otp/transient/verifications/{retrieval_data.trxnId} error: {str(error)}",
            exc_info=True,
        )
        return error
