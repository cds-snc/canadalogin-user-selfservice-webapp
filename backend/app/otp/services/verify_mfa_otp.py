import logging

from app.config import get_configuration
from app.otp.schemas import (
    OtpType,
    OtpVerificationAttemptRequest,
    OtpVerificationCreateRequest,
    VerificationCreateResponseData,
)
from app.users.services.profile import my_profile
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.helpers import generate_error_response
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel
from httpx import AsyncClient
from pydantic import ValidationError

logger = logging.getLogger(__name__)


async def handle_mfa_otp_verification_create(
    global_http_client: AsyncClient,
    verification_request: OtpVerificationCreateRequest,
    user_access_token: str,
    otp_type: OtpType,
):
    """Create an MFA OTP verification for SMS or Voice"""
    try:
        # Verify user profile
        my_profile_response = await my_profile(global_http_client, user_access_token)
        if not my_profile_response.success:
            logger.error(
                f"Failed to get user profile for {otp_type} verification creation"
            )
            return ResponseModel(
                success=False, data=None, message="User verification failed"
            )

        http_client_response = await dispatch_mfa_verification_create(
            global_http_client, verification_request, otp_type
        )

        response_json = http_client_response.json()

        try:
            # Parse the verification response
            verification_data = VerificationCreateResponseData(**response_json)

            return ResponseModel(
                success=True,
                data=verification_data,
                message=f"{otp_type.value} MFA OTP verification created successfully",
            )

        except ValidationError as e:
            logger.error(f"Validation Error: {e.json()}")
            return generate_error_response(422, "Server Error")

    except Exception as e:
        logger.error(f"{otp_type} MFA OTP verification creation error: {str(e)}")
        RequestErrorHandler.handle(e, f"{otp_type} MFA OTP verification creation")


async def handle_mfa_otp_verification_attempt(
    global_http_client: AsyncClient,
    attempt_request: OtpVerificationAttemptRequest,
    user_access_token: str,
    otp_type: OtpType,
):
    """Attempt MFA OTP verification for SMS or Voice"""
    try:
        # Verify user profile
        my_profile_response = await my_profile(global_http_client, user_access_token)
        if not my_profile_response.success:
            logger.error(
                f"Failed to get user profile for {otp_type} verification attempt"
            )
            return ResponseModel(
                success=False, data=None, message="User verification failed"
            )

        await dispatch_mfa_verification_attempt(
            global_http_client, attempt_request, otp_type
        )

        # IBM Verify API returns 204 No Content on successful verification attempt
        return ResponseModel(
            success=True,
            data=None,
            message=f"{otp_type.value} MFA OTP verification completed successfully",
        )

    except Exception as e:
        logger.error(f"{otp_type} MFA OTP verification attempt error: {str(e)}")
        RequestErrorHandler.handle(e, f"{otp_type} MFA OTP verification attempt")


async def dispatch_mfa_verification_create(
    global_http_client: AsyncClient,
    verification_request: OtpVerificationCreateRequest,
    otp_type: OtpType,
):
    """Dispatch MFA OTP verification creation to IBM Verify"""
    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_configuration().ibm_verify_config

        if otp_type == OtpType.SMS:
            verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/{verification_request.id}/verifications"
        elif otp_type == OtpType.VOICE:
            verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/{verification_request.id}/verifications"
        else:
            raise ValueError(f"Unsupported OTP type: {otp_type}")

        response = await global_http_client.post(
            verification_url, json={}, headers=headers
        )
        response.raise_for_status()
        return response

    except Exception as e:
        logger.error(
            f"{otp_type} MFA OTP verification creation dispatch error: {str(e)}"
        )
        RequestErrorHandler.handle(
            e, f"{otp_type} MFA OTP verification creation dispatch"
        )


async def dispatch_mfa_verification_attempt(
    global_http_client: AsyncClient,
    attempt_request: OtpVerificationAttemptRequest,
    otp_type: OtpType,
):
    """Dispatch MFA OTP verification attempt to IBM Verify"""
    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_configuration().ibm_verify_config

        attempt_data = {"otp": attempt_request.otp}

        if otp_type == OtpType.SMS:
            verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/{attempt_request.id}/verifications/{attempt_request.trxnId}"
        elif otp_type == OtpType.VOICE:
            verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/{attempt_request.id}/verifications/{attempt_request.trxnId}"
        else:
            raise ValueError(f"Unsupported OTP type: {otp_type}")

        response = await global_http_client.post(
            verification_url, json=attempt_data, headers=headers
        )
        response.raise_for_status()
        return response

    except Exception as e:
        logger.error(
            f"{otp_type} MFA OTP verification attempt dispatch error: {str(e)}"
        )
        RequestErrorHandler.handle(
            e, f"{otp_type} MFA OTP verification attempt dispatch"
        )
