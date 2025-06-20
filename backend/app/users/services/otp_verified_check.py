from fastapi import HTTPException
from httpx import AsyncClient
from app.config import get_settings
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.users.schemas import NewUserCreationData, TwoFactorEnrollmentUserData

import logging

logger = logging.getLogger(__name__)


async def _verify_otp(
    client: AsyncClient,
    url: str,
    new_user: NewUserCreationData = None,
    new_two_factor_user: TwoFactorEnrollmentUserData = None,
) -> bool:
    try:
        access_token = await get_admin_token(client)
        headers = get_auth_request_headers(access_token, True)
        response = await client.get(url, headers=headers)

        state = response.json().get("state")

        if state in {"PENDING", "TIMEOUT", "CANCELED", "FAILED"} and new_user:
            logger.error(
                f"Email verification has not been verified: verification state={state}"
            )
            return False

        elif (
            state in {"PENDING", "TIMEOUT", "CANCELED", "FAILED"}
            and new_two_factor_user
        ):
            logger.error(
                f"Phone number has not been verified: verification state={state}"
            )
            return False

        elif response.status_code != 200:
            logger.error(
                f"OTP verification check failed with status: {response.status_code}"
            )
            return False

        logger.info("OTP verification was successful.")
        return True

    except Exception as e:
        logger.error(f"OTP verification request error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"OTP verification error: {str(e)}")


async def otp_method_is_verified(
    global_http_client: AsyncClient,
    new_user: NewUserCreationData = None,
    new_two_factor_user: TwoFactorEnrollmentUserData = None,
) -> bool:
    settings = get_settings().ibm_verify_config
    base_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors"

    if new_user:
        url = f"{base_url}/emailotp/transient/verifications/{new_user.trxnId}"
        return await _verify_otp(global_http_client, url, new_user, None)

    if new_two_factor_user:
        url = f"{base_url}/{new_two_factor_user.enrollmentType}otp/transient/verifications/{new_two_factor_user.trxnId}"
        return await _verify_otp(global_http_client, url, None, new_two_factor_user)

    raise HTTPException(
        status_code=400, detail="No user data provided for OTP verification"
    )
