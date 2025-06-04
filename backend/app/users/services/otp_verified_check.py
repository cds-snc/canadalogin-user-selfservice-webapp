# import logging
# from fastapi import HTTPException
# from httpx import AsyncClient

# from app.utils.access_token import get_admin_token
# from app.config import get_settings
# from app.utils.access_token import get_auth_request_headers
# from app.users.schemas import (
#     TwoFactorEnrollmentUserData,
#     NewUserCreationData,
# )

# logger = logging.getLogger(__name__)


# async def otp_method_is_verified(
#     global_http_client: AsyncClient,
#     new_user: NewUserCreationData = None,
#     new_two_factor_user: TwoFactorEnrollmentUserData = None,
# ):
#     if new_user:
#         try:
#             access_token = await get_admin_token(global_http_client)
#             headers = get_auth_request_headers(access_token, True)
#             settings = get_settings().ibm_verify_config
#             send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications/{new_user.trxnId}"
#             response = await global_http_client.get(
#                 send_transient_otp_url, headers=headers
#             )

#             if response.json().get("state") == "PENDING":
#                 logger.error("Email verification is still pending.")
#                 return False

#             elif response.json().get("state") == "TIMEOUT":
#                 logger.error("Email verification timed out.")
#                 return False

#             elif response.json().get("state") == "CANCELED":
#                 logger.error("Email verification was canceled.")
#                 return False

#             elif response.json().get("state") == "FAILED":
#                 logger.error("Email verification has failed.")
#                 return False

#             elif response.status_code != 200:
#                 logger.error(
#                     f"Email verification check failed with http status code {response.status_code} from server."
#                 )
#                 return False

#             else:
#                 logger.error("Email was verified successfully.")
#                 return True

#         except HTTPException as he:
#             logger.error(f"HTTP Exception while checking is_verified: {str(he)}")
#             raise he
#         except Exception as e:
#             logger.error(f"is_verified check error: {str(e)}", exc_info=True)
#             raise HTTPException(status_code=400, detail=f"is_verified error: {str(e)}")

#     elif new_two_factor_user:
#         try:
#             access_token = await get_admin_token(global_http_client)
#             headers = get_auth_request_headers(access_token, True)
#             settings = get_settings().ibm_verify_config
#             send_transient_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/{new_two_factor_user.enrollmentType}otp/transient/verifications/{new_two_factor_user.trxnId}"
#             response = await global_http_client.get(
#                 send_transient_otp_url, headers=headers
#             )

#             if response.json().get("state") == "PENDING":
#                 logger.error("Email verification is still pending.")
#                 return False

#             elif response.json().get("state") == "TIMEOUT":
#                 logger.error("Email verification timed out.")
#                 return False

#             elif response.json().get("state") == "CANCELED":
#                 logger.error("Email verification was canceled.")
#                 return False

#             elif response.json().get("state") == "FAILED":
#                 logger.error("Email verification has failed.")
#                 return False

#             elif response.status_code != 200:
#                 logger.error(
#                     f"{new_two_factor_user} otp verification check failed with http status code {response.status_code} from server."
#                 )
#                 return False

#             else:
#                 logger.error(f"{new_two_factor_user} otp was verified successfully.")
#                 return True

#         except HTTPException as he:
#             logger.error(
#                 f"HTTP Exception while checking if {new_two_factor_user} otp was verified: {str(he)}"
#             )
#             raise he
#         except Exception as e:
#             logger.error(
#                 f"{new_two_factor_user} otp verification check error: {str(e)}",
#                 exc_info=True,
#             )
#             raise HTTPException(
#                 status_code=400,
#                 detail=f"{new_two_factor_user} otp verification check error: {str(e)}",
#             )


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
) -> bool:
    try:
        access_token = await get_admin_token(client)
        headers = get_auth_request_headers(access_token, True)
        response = await client.get(url, headers=headers)

        state = response.json().get("state")
        if state in {"PENDING", "TIMEOUT", "CANCELED", "FAILED"}:
            logger.error(f"OTP verification failed: state={state}")
            return False
        if response.status_code != 200:
            logger.error(f"OTP verification failed with status: {response.status_code}")
            return False

        logger.info("OTP verification successful.")
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
        return await _verify_otp(global_http_client, url)

    if new_two_factor_user:
        url = f"{base_url}/{new_two_factor_user.enrollmentType}otp/transient/verifications/{new_two_factor_user.trxnId}"
        return await _verify_otp(global_http_client, url)

    raise HTTPException(
        status_code=400, detail="No user data provided for OTP verification"
    )
