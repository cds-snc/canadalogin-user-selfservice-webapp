"""
Service for deleting FIDO2 registrations (passkeys)
"""

import logging
from httpx import AsyncClient
from fastapi import Request
from app.utils.access_token import get_auth_request_headers
from app.constants.verify_endpoints import VerifyAPIEndpoint
from app.fido2.schemas import (
    DeleteRegistrationRequest,
)
from app.fido2.services.helper_utils import (
    get_tenant_url,
    get_user_profile_info,
    verify_registration_ownership,
)
from app.fido2.services.authenticate_fido2_registration import (
    submit_assertion_result,
)
from app.utils.helpers import verify_otp_before_operation
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


async def delete_registration(
    request: Request,
    http_client: AsyncClient,
    user_access_token: str,
    request_data: DeleteRegistrationRequest,
) -> ResponseModel:
    """Delete a FIDO2 registration after verifying with FIDO2 authentication"""
    tenant_url = get_tenant_url()
    registration_id = request_data.id

    # Step 1: Verify FIDO2 authentication (only when an assertion result is provided)
    if request_data.assertionResult is not None:
        logger.info("Verifying FIDO2 authentication before deletion")
        assertion_response = await submit_assertion_result(
            request=request,
            http_client=http_client,
            user_access_token=user_access_token,
            request_body=request_data.assertionResult,
            return_jwt=False,
        )

        if not assertion_response.success:
            logger.error("FIDO2 authentication failed")
            return ResponseModel(
                success=False,
                message="FIDO2 authentication required to delete passkey",
            )

        logger.info("FIDO2 authentication verified successfully")
    elif (
        request_data.otp is not None
        and request_data.trxnId is not None
        and request_data.otpVerificationType is not None
    ):
        logger.info("Verifying OTP before deletion")
        await verify_otp_before_operation(
            global_http_client=http_client,
            otp=request_data.otp,
            trxn_id=request_data.trxnId,
            otp_type=request_data.otpVerificationType,
            user_access_token=user_access_token,
        )
        logger.info("OTP verified successfully")
    else:
        logger.info(
            "No assertionResult provided — skipping FIDO2 verification (OTP-verified flow)"
        )

    # Step 2: Get user ID from the token using userinfo endpoint
    _username, _display_name, user_id = await get_user_profile_info(
        http_client, user_access_token
    )

    # Verify ownership
    await verify_registration_ownership(
        http_client, user_access_token, registration_id, user_id
    )

    # Step 3: Delete the registration
    reg_url = (
        f"{tenant_url}{VerifyAPIEndpoint.FIDO2_REGISTRATIONS.value}/{registration_id}"
    )
    headers = get_auth_request_headers(user_access_token, json_content_type=True)

    delete_response = await http_client.delete(reg_url, headers=headers)
    delete_response.raise_for_status()

    logger.info(f"Registration deleted: {registration_id}")

    # Return success response (IBM Verify API returns 204 No Content on success)
    return ResponseModel(
        success=True,
        message="FIDO2 registration deleted successfully",
    )
