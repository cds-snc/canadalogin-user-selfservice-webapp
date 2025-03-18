import json
import logging
from datetime import datetime
from fastapi import HTTPException
from pydantic import ValidationError
from httpx import AsyncClient

from app.config import get_settings
from app.utils.helpers import generate_error_response
from app.otp.schemas import EmailOtpResponse, UserName
from app.utils.access_token import get_access_token, get_auth_request_headers
from app.utils.schemas import ResponseModel


logger = logging.getLogger(__name__)


async def ibm_send_email_opt(user_email_address: str):
    try:

        user_email_address = {
            "emailAddress": user_email_address
        }
        access_token = await get_access_token()
        headers = get_auth_request_headers(access_token, True)
        settings = get_settings().ibm_verify_config
        transient_email_otp_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications"

        async with AsyncClient() as client:
            response = await client.post(transient_email_otp_url, json=user_email_address, headers=headers)
            logger.info("Request returned")
            return response

    except Exception as error:
        logger.error(
            f"request_cloud_directory_id error: {str(error)}", exc_info=True)
        return error


async def send_email_otp(user_email_address: UserName):

    try:

        logger.info("Attempting to send email OTP")
        response = await ibm_send_email_opt(user_email_address.userName)
        if response.status_code is None:
            return generate_error_response(400, "Unknown error")
        if response.status_code != 201:
            logger.error(f"Send Email Request Error: {response.json()}")
            return generate_error_response(response.status_code, "Unknown error")

        response_json = response.json()

        if response.status_code == 201:
            logger.info("Email OTP created and sent")

            try:
                validated_data = EmailOtpResponse(**response_json)

            except ValidationError as e:
                logger.error(f"Validation Error: {e.json()}")
                return generate_error_response(422, "Server Error")

            return ResponseModel(
                success=True,
                data=validated_data,
                message="OTP sent successfully")

        # return successful_response

    except Exception as e:
        raise HTTPException(status_code=response.status_code,
                            detail=str(response.reason))


# async def verify_email_otp(request: Request):
#     data = await request.json()
#     admin_token = await get_admin_token()
#     response = None

#     headers = {
#         "Authorization": f"Bearer {admin_token}",
#         "Content-Type": "application/json",
#     }
#     pass_code = {
#         "otp": data.get('otp')
#     }
#     dd = data.get('trxnId')
#     try:
#         transient_email_verification_url = f"{settings.ibm_verify_config.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications/{dd}"
#         response = requests.post(
#             transient_email_verification_url, json=pass_code, headers=headers)

#         if response.status_code == 204:
#             logger.info("Email OTP has been validated")
#             return response.content

#     except Exception as e:
#         logger.error(e)
#         raise HTTPException(status_code=response.status_code,
#                             detail=str(response.reason))
