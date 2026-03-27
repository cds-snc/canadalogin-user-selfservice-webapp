import logging
from datetime import datetime

from fastapi import HTTPException, status
from httpx import AsyncClient

from app.config import get_configuration
from app.otp.schemas import RetrievalData, OtpDataResponse, OtpType
from app.utils.access_token import get_auth_request_headers
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def handle_otp_status_retrieval(
    global_http_client: AsyncClient,
    retrieval_data: RetrievalData,
    user_access_token: str,
):
    logger.info(f"Attempting to retrieve {retrieval_data.otpType} OTP.")
    start_time = datetime.now()
    http_client_response = await dispatch_otp_status_retrieval(
        global_http_client, retrieval_data, user_access_token
    )
    duration = (datetime.now() - start_time).total_seconds()
    logger.info(
        f"{retrieval_data.otpType} OTP retrieval request response received in {duration:.2f} seconds"
    )

    if (
        http_client_response.status_code is None
        or http_client_response.status_code != 200
    ):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error while retrieving {retrieval_data.otpType} OTP: {retrieval_data.trxnId}",
        )

    response_json = http_client_response.json()

    if http_client_response.status_code == 200:
        validated_data = OtpDataResponse(**response_json)

        return ResponseModel(
            success=True,
            data=validated_data,
            message=f"{retrieval_data.otpType} OTP status checked successfully",
        )


async def dispatch_otp_status_retrieval(
    global_http_client: AsyncClient,
    retrieval_data: RetrievalData,
    user_access_token: str,
):
    headers = get_auth_request_headers(user_access_token, True)
    settings = get_configuration().ibm_verify_config

    if retrieval_data.otpType == OtpType.SMS:
        send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/transient/verifications/{retrieval_data.trxnId}"
        response = await global_http_client.get(send_transient_otp_url, headers=headers)
        return response

    elif retrieval_data.otpType == OtpType.VOICE:
        send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/transient/verifications/{retrieval_data.trxnId}"
        response = await global_http_client.get(send_transient_otp_url, headers=headers)
        return response

    elif retrieval_data.otpType == OtpType.EMAIL:
        send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications/{retrieval_data.trxnId}"
        response = await global_http_client.get(send_transient_otp_url, headers=headers)
        return response

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error retrieving {retrieval_data.otpType} OTP",
        )
