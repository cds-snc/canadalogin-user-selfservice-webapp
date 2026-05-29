import logging
from datetime import datetime

from fastapi import HTTPException, status
from httpx import AsyncClient

from app.config import get_configuration
from app.otp.schemas import OtpType, RetrievalData, UserOtpVerificationInfo
from app.otp.services.retrieve_transient_otp import dispatch_otp_status_retrieval
from app.utils.access_token import get_auth_request_headers
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def _fetch_remaining_retries(
    global_http_client: AsyncClient,
    trxn_id: str,
    otp_type: OtpType,
    user_access_token: str,
):
    """Best-effort fetch of attempts/retries from the IBM Verify retrieve endpoint.

    Returns (attempts, retries) or (None, None) if the call fails or the
    transient OTP no longer exists (e.g. it was deleted after max attempts).
    """
    try:
        response = await dispatch_otp_status_retrieval(
            global_http_client,
            RetrievalData(trxnId=trxn_id, otpType=otp_type),
            user_access_token,
        )
        if response.status_code != 200:
            return None, None
        body = response.json()
        return body.get("attempts"), body.get("retries")
    except Exception as e:  # noqa: BLE001 - best-effort enrichment
        logger.warning(f"Failed to retrieve OTP attempts/retries: {e}")
        return None, None


async def handle_otp_verification(
    global_http_client: AsyncClient,
    user_verification_data: UserOtpVerificationInfo,
    user_access_token: str,
):
    """The global_http_client is a httpx AsyncClient connection pool, created at startup time. It can be found in main.py
    Use it for ALL API calls."""
    logger.info(f"Attempting to verify {user_verification_data.otpType} OTP")
    start_time = datetime.now()
    await verify_otp(global_http_client, user_verification_data, user_access_token)
    duration = (datetime.now() - start_time).total_seconds()
    logger.info(
        f"{user_verification_data.otpType} OTP verification response received in {duration:.2f} seconds"
    )

    return ResponseModel(  # Plain ResponseModel since the response has no content
        success=True,
        message=f"{user_verification_data.otpType.value} OTP has been verified",
    )


async def verify_otp(
    global_http_client: AsyncClient,
    user_verification_data: UserOtpVerificationInfo,
    user_access_token: str,
):
    trxnId = user_verification_data.trxnId
    otp = {
        "otp": user_verification_data.otp,
    }

    headers = get_auth_request_headers(user_access_token, True)
    settings = get_configuration().ibm_verify_config

    if user_verification_data.otpType == OtpType.SMS:
        verification_endpoint_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/transient/verifications/{trxnId}"

    elif user_verification_data.otpType == OtpType.VOICE:
        verification_endpoint_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/transient/verifications/{trxnId}"

    elif user_verification_data.otpType == OtpType.EMAIL:
        verification_endpoint_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications/{trxnId}"

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid User OTP Type",
        )
    response = await global_http_client.post(
        verification_endpoint_url, json=otp, headers=headers
    )

    if response.status_code == 204:
        logger.info("verify_otp returned successfully")
        return response

    # IBM Verify returned a failure — parse the response body for attempt tracking fields
    try:
        error_body = response.json()
    except Exception:
        error_body = {}

    message_id = error_body.get("messageId", "UNKNOWN")

    # The IBM Verify "attempt" endpoint does not return attempts/retries in its
    # error response body. For 400 responses (invalid OTP), look them up via the
    # retrieve endpoint so the frontend can show "X retries remaining" to the user.
    # We use the HTTP status code rather than checking specific messageId strings,
    # since IBM Verify may change those IDs without notice.
    attempts = None
    retries = None
    if response.status_code == 400:
        attempts, retries = await _fetch_remaining_retries(
            global_http_client,
            trxnId,
            user_verification_data.otpType,
            user_access_token,
        )

    logger.warning(
        f"OTP verification failed: status={response.status_code}, messageId={message_id}, attempts={attempts}, retries={retries}"
    )
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={
            "message": message_id,
            "attempts": attempts,
            "retries": retries,
        },
    )
