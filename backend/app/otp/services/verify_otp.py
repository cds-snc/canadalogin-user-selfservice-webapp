import logging
from datetime import datetime

from app.config import get_configuration
from app.otp.schemas import (
    OtpVerificationAttemptRequest,
    OtpVerificationCreateRequest,
    VerificationAttemptResponseData,
    VerificationCreateResponseData,
)
from app.users.services.profile import my_profile
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.helpers import generate_error_response
from app.utils.schemas import ResponseModel
from fastapi import HTTPException
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

        if http_client_response.status_code is None:
            return generate_error_response(400, "Unknown error")

        if http_client_response.status_code != 201:
            logger.error(
                f"Error creating SMS OTP verification: {http_client_response.json()}"
            )
            error_data = http_client_response.json()
            error_message = error_data.get(
                "error", "SMS OTP verification creation failed"
            )
            return ResponseModel(success=False, data=None, message=error_message)

        response_json = http_client_response.json()

        try:
            # Parse the verification response
            verification_data = VerificationCreateResponseData(
                id=response_json.get("id"),
                factorId=response_json.get("factorId"),
                userId=response_json.get("userId"),
                created=response_json.get("created"),
                updated=response_json.get("updated"),
                expiry=response_json.get("expiry"),
                state=response_json.get("state"),
                otpDeliveryStatus=response_json.get("otpDeliveryStatus"),
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
        logger.error(f"SMS OTP verification creation error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"SMS OTP verification creation error: {str(e)}"
        )


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

        if http_client_response.status_code is None:
            return generate_error_response(400, "Unknown error")

        if http_client_response.status_code != 201:
            logger.error(
                f"Error creating Voice OTP verification: {http_client_response.json()}"
            )
            error_data = http_client_response.json()
            error_message = error_data.get(
                "error", "Voice OTP verification creation failed"
            )
            return ResponseModel(success=False, data=None, message=error_message)

        response_json = http_client_response.json()

        try:
            # Parse the verification response
            verification_data = VerificationCreateResponseData(
                id=response_json.get("id"),
                factorId=response_json.get("factorId"),
                userId=response_json.get("userId"),
                created=response_json.get("created"),
                updated=response_json.get("updated"),
                expiry=response_json.get("expiry"),
                state=response_json.get("state"),
                otpDeliveryStatus=response_json.get("otpDeliveryStatus"),
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
        logger.error(f"Voice OTP verification creation error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Voice OTP verification creation error: {str(e)}"
        )


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

        http_client_response = await dispatch_sms_verification_attempt(
            global_http_client, attempt_request
        )
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"SMS OTP verification attempt completed in {duration:.2f} seconds")

        if http_client_response.status_code is None:
            return generate_error_response(400, "Unknown error")

        if http_client_response.status_code != 200:
            logger.error(
                f"Error attempting SMS OTP verification: {http_client_response.json()}"
            )
            error_data = http_client_response.json()
            error_message = error_data.get("error", "SMS OTP verification failed")
            return ResponseModel(success=False, data=None, message=error_message)

        response_json = http_client_response.json()

        try:
            # Parse the verification attempt response
            attempt_data = VerificationAttemptResponseData(
                id=response_json.get("id"),
                factorId=response_json.get("factorId"),
                userId=response_json.get("userId"),
                created=response_json.get("created"),
                updated=response_json.get("updated"),
                expiry=response_json.get("expiry"),
                state=response_json.get("state"),
                verified=response_json.get("verified", False),
            )

            return ResponseModel(
                success=True,
                data=attempt_data,
                message="SMS OTP verification completed successfully",
            )

        except ValidationError as e:
            logger.error(f"Validation Error: {e.json()}")
            return generate_error_response(422, "Server Error")

    except Exception as e:
        logger.error(f"SMS OTP verification attempt error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"SMS OTP verification attempt error: {str(e)}"
        )


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

        http_client_response = await dispatch_voice_verification_attempt(
            global_http_client, attempt_request
        )
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"Voice OTP verification attempt completed in {duration:.2f} seconds"
        )

        if http_client_response.status_code is None:
            return generate_error_response(400, "Unknown error")

        if http_client_response.status_code != 200:
            logger.error(
                f"Error attempting Voice OTP verification: {http_client_response.json()}"
            )
            error_data = http_client_response.json()
            error_message = error_data.get("error", "Voice OTP verification failed")
            return ResponseModel(success=False, data=None, message=error_message)

        response_json = http_client_response.json()

        try:
            # Parse the verification attempt response
            attempt_data = VerificationAttemptResponseData(
                id=response_json.get("id"),
                factorId=response_json.get("factorId"),
                userId=response_json.get("userId"),
                created=response_json.get("created"),
                updated=response_json.get("updated"),
                expiry=response_json.get("expiry"),
                state=response_json.get("state"),
                verified=response_json.get("verified", False),
            )

            return ResponseModel(
                success=True,
                data=attempt_data,
                message="Voice OTP verification completed successfully",
            )

        except ValidationError as e:
            logger.error(f"Validation Error: {e.json()}")
            return generate_error_response(422, "Server Error")

    except Exception as e:
        logger.error(f"Voice OTP verification attempt error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Voice OTP verification attempt error: {str(e)}"
        )


async def dispatch_sms_verification_create(
    global_http_client: AsyncClient,
    verification_request: OtpVerificationCreateRequest,
):
    """Dispatch SMS OTP verification creation to IBM Verify"""
    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_configuration().ibm_verify_config

        verification_data = {"factorId": verification_request.factorId}

        verification_url = (
            f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/verifications"
        )
        response = await global_http_client.post(
            verification_url, json=verification_data, headers=headers
        )
        return response

    except HTTPException as he:
        logger.error(f"HTTP Exception in SMS OTP verification creation: {str(he)}")
        raise he
    except Exception as error:
        logger.error(
            f"Request to /v2.0/factors/smsotp/verifications error: {str(error)}",
            exc_info=True,
        )
        raise error


async def dispatch_voice_verification_create(
    global_http_client: AsyncClient,
    verification_request: OtpVerificationCreateRequest,
):
    """Dispatch Voice OTP verification creation to IBM Verify"""
    try:
        access_token = await get_admin_token(global_http_client)
        headers = get_auth_request_headers(access_token, True)
        settings = get_configuration().ibm_verify_config

        verification_data = {"factorId": verification_request.factorId}

        verification_url = (
            f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/verifications"
        )
        response = await global_http_client.post(
            verification_url, json=verification_data, headers=headers
        )
        return response

    except HTTPException as he:
        logger.error(f"HTTP Exception in Voice OTP verification creation: {str(he)}")
        raise he
    except Exception as error:
        logger.error(
            f"Request to /v2.0/factors/voiceotp/verifications error: {str(error)}",
            exc_info=True,
        )
        raise error


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

        verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/verifications/{attempt_request.verificationId}"
        response = await global_http_client.put(
            verification_url, json=attempt_data, headers=headers
        )
        return response

    except HTTPException as he:
        logger.error(f"HTTP Exception in SMS OTP verification attempt: {str(he)}")
        raise he
    except Exception as error:
        logger.error(
            f"Request to /v2.0/factors/smsotp/verifications/{attempt_request.verificationId} error: {str(error)}",
            exc_info=True,
        )
        raise error


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

        verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/verifications/{attempt_request.verificationId}"
        response = await global_http_client.put(
            verification_url, json=attempt_data, headers=headers
        )
        return response

    except HTTPException as he:
        logger.error(f"HTTP Exception in Voice OTP verification attempt: {str(he)}")
        raise he
    except Exception as error:
        logger.error(
            f"Request to /v2.0/factors/voiceotp/verifications/{attempt_request.verificationId} error: {str(error)}",
            exc_info=True,
        )
        raise error
