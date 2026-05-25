import logging
from datetime import datetime

from app.config import get_configuration
from app.fido2.services.authenticate_fido2_registration import submit_assertion_result
from app.otp.schemas import (
    OtpBatchDeletionRequest,
    OtpDeletionRequest,
    OtpType,
)
from app.users.services.get_my_profile import get_my_profile
from app.users.services.otp_factors import get_user_otp_factors
from app.utils.access_token import get_auth_request_headers
from app.utils.schemas import ResponseModel
from app.utils.helpers import verify_otp_before_operation
from fastapi import HTTPException, Request, status
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
    request: Request | None = None,
):
    """Delete an OTP factor enrollment (SMS or Voice) after OTP verification.

    When otp is None the factor must be unvalidated — this is used by the Add MFA
    flow to clean up a lingering pending enrollment before re-enrolling.  A validated
    factor cannot be deleted without OTP; use handle_otp_batch_deletion instead.
    """

    otp_type = deletion_request.otpType
    logger.info(f"Attempting to delete {otp_type} OTP factor")
    start_time = datetime.now()

    # Get user ID and preferred language from the access token
    my_profile_response = await get_my_profile(global_http_client, user_access_token)
    user_id = my_profile_response.data.id
    user_language = my_profile_response.data.preferredLanguage or "en"
    logger.info(f"Using user's preferred language: {user_language}")

    if deletion_request.otp is None and deletion_request.assertionResult is None:
        # No OTP provided — only permitted for genuinely unvalidated factors.
        # Fetch the unvalidated factors and confirm this factor is among them.
        unvalidated_factors_response = await get_user_otp_factors(
            global_http_client, user_access_token, validated=False
        )
        unvalidated_ids = (
            {f.id for f in unvalidated_factors_response.data}
            if unvalidated_factors_response.success
            else set()
        )
        if deletion_request.id not in unvalidated_ids:
            logger.warning(
                f"User {user_id} attempted to delete factor {deletion_request.id} "
                "without OTP, but the factor is not unvalidated"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP verification is required to delete a validated MFA factor",
            )
    else:
        if deletion_request.assertionResult is not None:
            if request is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Request context required for passkey verification",
                )

            assertion_response = await submit_assertion_result(
                request=request,
                http_client=global_http_client,
                user_access_token=user_access_token,
                request_body=deletion_request.assertionResult,
                return_jwt=False,
            )

            if not assertion_response.success:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="FIDO2 authentication required to delete MFA factor",
                )
        else:
            # Validated factor deletion path — OTP verification required.
            # Use the verification OTP type (may differ from the factor being deleted)
            await verify_otp_before_operation(
                global_http_client=global_http_client,
                user_access_token=user_access_token,
                otp=deletion_request.otp,
                trxn_id=deletion_request.trxnId,
                otp_type=deletion_request.otpVerificationType,
            )

        # Step 2: Check if user has multiple factors before allowing deletion
        # Check all factors (validated and unvalidated) to prevent deletion of last remaining factor
        user_factors_response = await get_user_otp_factors(
            global_http_client, user_access_token, validated=None
        )
        if not user_factors_response.success or len(user_factors_response.data) <= 1:
            logger.warning(f"User {user_id} cannot delete last remaining MFA factor")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete last remaining MFA factor",
            )

    # Dispatch the deletion to IBM Verify
    http_client_response = await dispatch_otp_deletion(
        global_http_client, deletion_request, user_access_token, user_language
    )
    duration = (datetime.now() - start_time).total_seconds()
    logger.info(f"{otp_type} OTP deletion request completed in {duration:.2f} seconds")

    if http_client_response.status_code == 204:
        # IBM Verify returns 204 No Content for successful deletion
        logger.info(f"Successfully deleted {otp_type} OTP factor")
        return ResponseModel(
            success=True,
            data={"factorId": deletion_request.id, "otpType": otp_type.value},
            message=f"{otp_type.value} OTP factor deleted successfully",
        )
    else:
        raise HTTPStatusError(
            "Unable to delete MFA phone number",
            request=http_client_response.request,
            response=http_client_response,
        )


async def handle_otp_batch_deletion(
    global_http_client: AsyncClient,
    deletion_request: OtpBatchDeletionRequest,
    user_access_token: str,
    request: Request | None = None,
):
    """Delete multiple OTP factors with a single OTP verification.

    Verifies the OTP once, checks the last-factor guard, then deletes every
    factor in the request.  IBM Verify trxnIds are single-use, so callers must
    use this endpoint instead of making separate delete calls when removing
    more than one factor tied to the same phone number.
    """
    logger.info(
        f"Attempting batch deletion of {len(deletion_request.factors)} OTP factor(s)"
    )
    start_time = datetime.now()

    if deletion_request.assertionResult is not None:
        if request is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Request context required for passkey verification",
            )

        assertion_response = await submit_assertion_result(
            request=request,
            http_client=global_http_client,
            user_access_token=user_access_token,
            request_body=deletion_request.assertionResult,
            return_jwt=False,
        )

        if not assertion_response.success:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="FIDO2 authentication required to delete MFA factor",
            )
    else:
        # Verify OTP once for the entire batch
        await verify_otp_before_operation(
            global_http_client=global_http_client,
            user_access_token=user_access_token,
            otp=deletion_request.otp,
            trxn_id=deletion_request.trxnId,
            otp_type=deletion_request.otpVerificationType,
        )

    # Last-factor protection: ensure the user will retain at least one factor
    user_factors_response = await get_user_otp_factors(
        global_http_client, user_access_token, validated=None
    )
    if not user_factors_response.success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to retrieve user MFA factors",
        )
    total_factors = len(user_factors_response.data)
    if total_factors - len(deletion_request.factors) < 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete last remaining MFA factor",
        )

    # Delete each factor
    deleted_factors = []
    for factor in deletion_request.factors:
        single_request = OtpDeletionRequest(id=factor.id, otpType=factor.otpType)
        http_response = await dispatch_otp_deletion(
            global_http_client, single_request, user_access_token
        )
        if http_response.status_code == 204:
            deleted_factors.append(
                {"factorId": factor.id, "otpType": factor.otpType.value}
            )
        else:
            raise HTTPStatusError(
                f"Unable to delete MFA factor {factor.id}",
                request=http_response.request,
                response=http_response,
            )

    duration = (datetime.now() - start_time).total_seconds()
    logger.info(f"Batch OTP deletion completed in {duration:.2f} seconds")
    return ResponseModel(
        success=True,
        data={"deletedFactors": deleted_factors},
        message=f"{len(deleted_factors)} MFA factor(s) deleted successfully",
    )


async def dispatch_otp_deletion(
    global_http_client: AsyncClient,
    deletion_request: OtpDeletionRequest,
    user_access_token: str,
    language: str = None,
):
    """Dispatch OTP deletion to IBM Verify (SMS or Voice)"""
    # Determine the endpoint based on OTP type first to validate
    endpoint = _get_endpoint_for_otp_type(deletion_request.otpType)
    if endpoint == "unknown":
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            f"Unsupported OTP type: {deletion_request.otpType}",
        )

    headers = get_auth_request_headers(user_access_token, True, language)
    settings = get_configuration().ibm_verify_config

    deletion_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/{endpoint}/{deletion_request.id}"
    logger.info(f"Calling IBM Verify DELETE {deletion_url}")

    response = await global_http_client.delete(deletion_url, headers=headers)
    response.raise_for_status()
    return response
