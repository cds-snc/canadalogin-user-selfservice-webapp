import logging
from datetime import datetime

from app.config import get_configuration
from app.otp.schemas import OtpDeletionRequest, OtpType
from app.users.services.get_my_profile import get_my_profile
from app.users.services.otp_factors import get_user_otp_factors
from app.utils.access_token import get_auth_request_headers
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel
from app.utils.helpers import verify_otp_before_operation
from fastapi import HTTPException, status
from httpx import AsyncClient, HTTPStatusError

logger = logging.getLogger(__name__)


def _get_endpoint_for_otp_type(otp_type: OtpType) -> str:
    """Helper function to determine the endpoint based on OTP type"""
    if otp_type == OtpType.SMS:
        return "smsotp"
    elif otp_type == OtpType.VOICE:
        return "voiceotp"
    else:
        return "unknown"


async def handle_otp_deletion(
    global_http_client: AsyncClient,
    deletion_request: OtpDeletionRequest,
    user_access_token: str,
):
    """Delete an OTP factor enrollment (SMS or Voice) after OTP verification"""
    try:
        otp_type = deletion_request.otpType
        logger.info(f"Attempting to delete {otp_type} OTP factor")
        start_time = datetime.now()

        # Get user ID from the access token
        my_profile_response = await get_my_profile(
            global_http_client, user_access_token
        )
        user_id = my_profile_response.data.id

        if deletion_request.otp is None:
            # Unvalidated factor deletion path — no OTP required.
            # Verify the factor is actually unvalidated before allowing deletion.
            unvalidated_factors = await get_user_otp_factors(
                global_http_client, user_access_token, validated=False
            )
            factor_is_unvalidated = unvalidated_factors.success and any(
                f.id == deletion_request.id for f in (unvalidated_factors.data or [])
            )
            if not factor_is_unvalidated:
                logger.warning(
                    f"Factor {deletion_request.id} is not unvalidated; OTP required"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="OTP verification required to delete a validated factor",
                )
        else:
            # Validated factor deletion path — OTP verification required.
            # Step 1: Verify OTP before proceeding with deletion
            # Use the verification OTP type (may differ from the factor being deleted)
            await verify_otp_before_operation(
                global_http_client=global_http_client,
                otp=deletion_request.otp,
                trxn_id=deletion_request.trxnId,
                otp_type=deletion_request.otpVerificationType,
            )

            # Step 2: Check if user has multiple factors before allowing deletion
            # Check all factors (validated and unvalidated) to prevent deletion of last remaining factor
            user_factors_response = await get_user_otp_factors(
                global_http_client, user_access_token, validated=None
            )
            if (
                not user_factors_response.success
                or len(user_factors_response.data) <= 1
            ):
                logger.warning(
                    f"User {user_id} cannot delete last remaining MFA factor"
                )
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Cannot delete last remaining MFA factor",
                )

        # Dispatch the deletion to IBM Verify
        http_client_response = await dispatch_otp_deletion(
            global_http_client, deletion_request, user_access_token
        )
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"{otp_type} OTP deletion request completed in {duration:.2f} seconds"
        )

        if http_client_response.status_code == 204:
            # IBM Verify returns 204 No Content for successful deletion
            logger.info(f"Successfully deleted {otp_type} OTP factor")
            return ResponseModel(
                success=True,
                data={"factorId": deletion_request.id, "otpType": otp_type.value},
                message=f"{otp_type.value} OTP factor deleted successfully",
            )
        else:
            logger.error(
                f"Unexpected response status: {http_client_response.status_code}"
            )
            return ResponseModel(
                success=False, data=None, message="Unable to delete MFA phone number"
            )

    except HTTPException:
        # Re-raise HTTPException as-is (like 409 Conflict or 400 Bad Request from OTP verification)
        raise
    except Exception as e:
        logger.error(
            f"{deletion_request.otpType} OTP deletion error: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete MFA phone number",
        )


async def dispatch_otp_deletion(
    global_http_client: AsyncClient,
    deletion_request: OtpDeletionRequest,
    user_access_token: str,
):
    """Dispatch OTP deletion to IBM Verify (SMS or Voice)"""
    try:
        # Determine the endpoint based on OTP type first to validate
        endpoint = _get_endpoint_for_otp_type(deletion_request.otpType)
        if endpoint == "unknown":
            raise ValueError(f"Unsupported OTP type: {deletion_request.otpType}")

        headers = get_auth_request_headers(user_access_token, True)
        settings = get_configuration().ibm_verify_config

        deletion_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/{endpoint}/{deletion_request.id}"
        logger.info(f"Calling IBM Verify DELETE {deletion_url}")

        response = await global_http_client.delete(deletion_url, headers=headers)
        response.raise_for_status()
        return response

    except HTTPStatusError as e:
        logger.error(f"HTTP error during {deletion_request.otpType} deletion: {e}")
        return RequestErrorHandler.handle(e)
    except Exception as error:
        # Determine endpoint for error logging
        endpoint = _get_endpoint_for_otp_type(deletion_request.otpType)

        logger.error(
            f"Request to /v2.0/factors/{endpoint}/{deletion_request.id} error: {str(error)}",
            exc_info=True,
        )
        # Don't expose server errors to client
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete MFA phone number",
        )
