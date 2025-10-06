import logging
from datetime import datetime

from app.config import get_configuration
from app.otp.schemas import (
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


async def handle_sms_otp_verification_create(
    global_http_client: AsyncClient,
    verification_request: OtpVerificationCreateRequest,
    user_access_token: str,
):
    """Create a SMS OTP verification"""
    try:
        logger.info("Attempting to create SMS OTP verification")
        start_time = datetime.now()

        # Verify user profile
        my_profile_response = await my_profile(global_http_client, user_access_token)
        if not my_profile_response.success:
            logger.error("Failed to get user profile for SMS verification creation")
            return ResponseModel(
                success=False, data=None, message="User verification failed"
            )

        user_id = my_profile_response.data.id
        logger.info(f"Creating SMS OTP verification for user: {user_id}")

        http_client_response = await dispatch_sms_verification_create(
            global_http_client, verification_request
        )
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"SMS OTP verification creation completed in {duration:.2f} seconds"
        )

        response_json = http_client_response.json()

        try:
            # Parse the verification response
            verification_data = VerificationCreateResponseData(
                id=response_json.get("id"),
                userId=response_json.get("userId"),
                type=response_json.get("type"),
                created=response_json.get("created"),
                updated=response_json.get("updated"),
                expiry=response_json.get("expiry"),
                state=response_json.get("state"),
                updatedBy=response_json.get("updatedBy"),
                correlation=response_json.get("correlation"),
                phoneNumber=response_json.get("phoneNumber"),
                attempts=response_json.get("attempts"),
                retries=response_json.get("retries"),
            )

            return ResponseModel(
                success=True,
                data=verification_data,
                message="SMS OTP verification created successfully",
            )

        except ValidationError as e:
            logger.error(f"Validation Error: {e.json()}")
            return generate_error_response(422, "Server Error")

    except Exception as e:
        logger.error(f"SMS OTP verification creation error: {str(e)}")
        RequestErrorHandler.handle(e, "SMS OTP verification creation")


async def handle_voice_otp_verification_create(
    global_http_client: AsyncClient,
    verification_request: OtpVerificationCreateRequest,
    user_access_token: str,
):
    """Create a Voice OTP verification"""
    try:
        logger.info("Attempting to create Voice OTP verification")
        start_time = datetime.now()

        # Verify user profile
        my_profile_response = await my_profile(global_http_client, user_access_token)
        if not my_profile_response.success:
            logger.error("Failed to get user profile for Voice verification creation")
            return ResponseModel(
                success=False, data=None, message="User verification failed"
            )

        user_id = my_profile_response.data.id
        logger.info(f"Creating Voice OTP verification for user: {user_id}")

        http_client_response = await dispatch_voice_verification_create(
            global_http_client, verification_request
        )
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"Voice OTP verification creation completed in {duration:.2f} seconds"
        )

        response_json = http_client_response.json()

        try:
            # Parse the verification response using IBM Verify field structure
            verification_data = VerificationCreateResponseData(
                id=response_json.get("id"),
                userId=response_json.get("userId"),
                type=response_json.get("type"),
                created=response_json.get("created"),
                updated=response_json.get("updated"),
                expiry=response_json.get("expiry"),
                state=response_json.get("state"),
                updatedBy=response_json.get("updatedBy"),
                correlation=response_json.get("correlation"),
                phoneNumber=response_json.get("phoneNumber"),
                attempts=response_json.get("attempts"),
                retries=response_json.get("retries"),
            )

            return ResponseModel(
                success=True,
                data=verification_data,
                message="Voice OTP verification created successfully",
            )

        except ValidationError as e:
            logger.error(f"Validation Error: {e.json()}")
            return generate_error_response(422, "Server Error")

    except Exception as e:
        logger.error(f"Voice OTP verification creation error: {str(e)}")
        RequestErrorHandler.handle(e, "Voice OTP verification creation")


async def handle_sms_otp_verification_attempt(
    global_http_client: AsyncClient,
    attempt_request: OtpVerificationAttemptRequest,
    user_access_token: str,
):
    """Attempt SMS OTP verification"""
    try:
        logger.info("Attempting SMS OTP verification")
        start_time = datetime.now()

        # Verify user profile
        my_profile_response = await my_profile(global_http_client, user_access_token)
        if not my_profile_response.success:
            logger.error("Failed to get user profile for SMS verification attempt")
            return ResponseModel(
                success=False, data=None, message="User verification failed"
            )

        user_id = my_profile_response.data.id
        logger.info(f"Attempting SMS OTP verification for user: {user_id}")

        await dispatch_sms_verification_attempt(global_http_client, attempt_request)
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"SMS OTP verification attempt completed in {duration:.2f} seconds")

        # IBM Verify API returns 204 No Content on successful verification attempt
        return ResponseModel(
            success=True,
            data=None,
            message="SMS OTP verification completed successfully",
        )

    except Exception as e:
        logger.error(f"SMS OTP verification attempt error: {str(e)}")
        RequestErrorHandler.handle(e, "SMS OTP verification attempt")


async def handle_voice_otp_verification_attempt(
    global_http_client: AsyncClient,
    attempt_request: OtpVerificationAttemptRequest,
    user_access_token: str,
):
    """Attempt Voice OTP verification"""
    try:
        logger.info("Attempting Voice OTP verification")
        start_time = datetime.now()

        # Verify user profile
        my_profile_response = await my_profile(global_http_client, user_access_token)
        if not my_profile_response.success:
            logger.error("Failed to get user profile for Voice verification attempt")
            return ResponseModel(
                success=False, data=None, message="User verification failed"
            )

        user_id = my_profile_response.data.id
        logger.info(f"Attempting Voice OTP verification for user: {user_id}")

        await dispatch_voice_verification_attempt(global_http_client, attempt_request)
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"Voice OTP verification attempt completed in {duration:.2f} seconds"
        )

        # IBM Verify API returns 204 No Content on successful verification attempt
        return ResponseModel(
            success=True,
            data=None,
            message="Voice OTP verification completed successfully",
        )

    except Exception as e:
        logger.error(f"Voice OTP verification attempt error: {str(e)}")
        RequestErrorHandler.handle(e, "Voice OTP verification attempt")


async def dispatch_sms_verification_create(
    global_http_client: AsyncClient,
    verification_request: OtpVerificationCreateRequest,
):
    """Dispatch SMS OTP verification creation to IBM Verify"""
    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_configuration().ibm_verify_config

        verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/{verification_request.id}/verifications"
        response = await global_http_client.post(
            verification_url, json={}, headers=headers
        )
        response.raise_for_status()
        return response

    except Exception as e:
        logger.error(f"SMS OTP verification creation dispatch error: {str(e)}")
        RequestErrorHandler.handle(e, "SMS OTP verification creation dispatch")


async def dispatch_voice_verification_create(
    global_http_client: AsyncClient,
    verification_request: OtpVerificationCreateRequest,
):
    """Dispatch Voice OTP verification creation to IBM Verify"""
    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_configuration().ibm_verify_config

        verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/{verification_request.id}/verifications"
        response = await global_http_client.post(
            verification_url, json={}, headers=headers
        )
        response.raise_for_status()
        return response

    except Exception as e:
        logger.error(f"Voice OTP verification creation dispatch error: {str(e)}")
        RequestErrorHandler.handle(e, "Voice OTP verification creation dispatch")


async def dispatch_sms_verification_attempt(
    global_http_client: AsyncClient,
    attempt_request: OtpVerificationAttemptRequest,
):
    """Dispatch SMS OTP verification attempt to IBM Verify"""
    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_configuration().ibm_verify_config

        attempt_data = {"otp": attempt_request.otp}

        verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/{attempt_request.id}/verifications/{attempt_request.trxnId}"
        response = await global_http_client.post(
            verification_url, json=attempt_data, headers=headers
        )
        response.raise_for_status()
        return response

    except Exception as e:
        logger.error(f"SMS OTP verification attempt dispatch error: {str(e)}")
        RequestErrorHandler.handle(e, "SMS OTP verification attempt dispatch")


async def dispatch_voice_verification_attempt(
    global_http_client: AsyncClient,
    attempt_request: OtpVerificationAttemptRequest,
):
    """Dispatch Voice OTP verification attempt to IBM Verify"""
    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_configuration().ibm_verify_config

        attempt_data = {"otp": attempt_request.otp}

        verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/{attempt_request.id}/verifications/{attempt_request.trxnId}"
        response = await global_http_client.post(
            verification_url, json=attempt_data, headers=headers
        )
        response.raise_for_status()
        return response

    except Exception as e:
        logger.error(f"Voice OTP verification attempt dispatch error: {str(e)}")
        RequestErrorHandler.handle(e, "Voice OTP verification attempt dispatch")
