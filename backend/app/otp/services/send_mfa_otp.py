from app.config import get_configuration
from app.otp.schemas import (
    OtpType,
    OtpVerificationCreateRequest,
    VerificationCreateResponseData,
)
from app.users.services.get_my_profile import get_my_profile
from app.utils.access_token import get_auth_request_headers
from app.utils.phone_mfa_rate_limit import (
    assert_phone_mfa_registration_rate_limit_not_exceeded,
    record_phone_mfa_registration_event,
)
from app.utils.schemas import ResponseModel
from fastapi import HTTPException, Request, status


from httpx import AsyncClient

import logging

logger = logging.getLogger(__name__)

PHONE_MFA_SENT_FACTORS_SESSION_KEY = "phone_mfa_sent_factor_ids"


def _get_sent_factor_ids_from_session(request: Request) -> set[str]:
    session = getattr(request, "session", None)
    if not isinstance(session, dict):
        return set()

    stored_value = session.get(PHONE_MFA_SENT_FACTORS_SESSION_KEY, [])
    if not isinstance(stored_value, list):
        return set()

    return {factor_id for factor_id in stored_value if isinstance(factor_id, str)}


def _mark_factor_id_as_sent(request: Request, factor_id: str) -> None:
    if not factor_id:
        return

    session = getattr(request, "session", None)
    if not isinstance(session, dict):
        return

    sent_factor_ids = _get_sent_factor_ids_from_session(request)
    sent_factor_ids.add(factor_id)
    session[PHONE_MFA_SENT_FACTORS_SESSION_KEY] = list(sent_factor_ids)


async def dispatch_send_mfa_otp(
    global_http_client: AsyncClient,
    verification_request: OtpVerificationCreateRequest,
    otp_type: OtpType,
    user_access_token: str,
    language: str = None,
):
    """Dispatch Send MFA OTP verification to IBM Verify."""
    headers = get_auth_request_headers(user_access_token, True, language)
    settings = get_configuration().ibm_verify_config

    if otp_type == OtpType.SMS:
        verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/smsotp/{verification_request.id}/verifications"
    elif otp_type == OtpType.VOICE:
        verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/voiceotp/{verification_request.id}/verifications"
    elif otp_type == OtpType.EMAIL:
        verification_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/{verification_request.id}/verifications"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OTP type: {otp_type}",
        )

    response = await global_http_client.post(verification_url, json={}, headers=headers)
    response.raise_for_status()
    return response


async def handle_send_mfa_otp(
    global_http_client: AsyncClient,
    verification_request: OtpVerificationCreateRequest,
    user_access_token: str,
    otp_type: OtpType,
    request: Request | None = None,
):
    """Send an MFA OTP for SMS, Voice, or Email."""

    # Verify user profile
    my_profile_response = await get_my_profile(global_http_client, user_access_token)
    if not my_profile_response.success:
        otp_type_str = otp_type.value if hasattr(otp_type, "value") else str(otp_type)
        logger.error(
            f"Failed to get user profile for {otp_type_str} verification creation"
        )
        return ResponseModel(
            success=False, data=None, message="User verification failed"
        )

    # Get user's preferred language from profile
    user_id = my_profile_response.data.id
    user_language = my_profile_response.data.preferredLanguage or "en"
    logger.info(f"Using user's preferred language: {user_language}")

    should_enforce_phone_rate_limit = request is not None and otp_type in {
        OtpType.SMS,
        OtpType.VOICE,
    }

    if should_enforce_phone_rate_limit:
        await assert_phone_mfa_registration_rate_limit_not_exceeded(request, user_id)

    should_record_phone_rate_limit_event = False
    if should_enforce_phone_rate_limit:
        # Backend anti-bypass guard:
        # if this is the first successful send for a factor in this session,
        # count it even when countAsMfaAddition is false.
        sent_factor_ids = _get_sent_factor_ids_from_session(request)
        should_record_phone_rate_limit_event = (
            verification_request.countAsMfaAddition
            or verification_request.id not in sent_factor_ids
        )

    http_client_response = await dispatch_send_mfa_otp(
        global_http_client,
        verification_request,
        otp_type,
        user_access_token,
        user_language,
    )

    if should_enforce_phone_rate_limit:
        _mark_factor_id_as_sent(request, verification_request.id)

    if should_record_phone_rate_limit_event:
        await record_phone_mfa_registration_event(request, user_id)

    response_json = http_client_response.json()
    logger.info(f"IBM Verify MFA OTP response: {response_json}")

    # Parse the verification response
    verification_data = VerificationCreateResponseData(**response_json)

    return ResponseModel(
        success=True,
        data=verification_data,
        message=f"{otp_type.value} MFA OTP verification created successfully",
    )
