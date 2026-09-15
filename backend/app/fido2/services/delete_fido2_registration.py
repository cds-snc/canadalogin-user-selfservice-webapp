"""
Service for deleting FIDO2 registrations (passkeys)
"""

import logging
import time
import uuid
from datetime import datetime, timezone
from httpx import AsyncClient
from fastapi import HTTPException, Request, status
from app.utils.access_token import get_auth_request_headers
from app.constants.verify_endpoints import VerifyAPIEndpoint
from app.users.services.get_my_profile import dispatch_get_my_profile_from_ibm
from app.users.services.mfa_delete_guard import (
    assert_remaining_mfa_factor_after_deletion,
)
from app.config import get_configuration
from app.fido2.schemas import (
    DeleteRegistrationRequest,
)
from app.otp.schemas import RetrievalData
from app.otp.services.retrieve_transient_otp import dispatch_otp_status_retrieval
from app.fido2.services.helper_utils import (
    get_tenant_url,
    get_user_profile_info,
    verify_registration_ownership,
)
from app.fido2.services.authenticate_fido2_registration import (
    submit_assertion_result,
)
from app.utils.helpers import verify_otp_before_operation
from app.utils.global_error_handlers import extract_response_body
from app.utils.schemas import ResponseModel
from httpx import HTTPStatusError

logger = logging.getLogger(__name__)

FIDO2_DELETE_VERIFICATION_PROOFS_SESSION_KEY = "fido2_delete_verification_proofs"


def _get_fido2_delete_proof_store(request: Request) -> dict[str, dict]:
    proof_store = request.session.get(FIDO2_DELETE_VERIFICATION_PROOFS_SESSION_KEY, {})
    if isinstance(proof_store, dict):
        return proof_store
    return {}


def _prune_expired_fido2_delete_proofs(proof_store: dict[str, dict]) -> dict[str, dict]:
    now = int(time.time())
    pruned_store: dict[str, dict] = {}

    for proof_id, proof_data in proof_store.items():
        if not isinstance(proof_data, dict):
            continue

        expires_at = proof_data.get("expiresAt")
        if isinstance(expires_at, int) and expires_at > now:
            pruned_store[proof_id] = proof_data

    return pruned_store


def _store_fido2_delete_verification_proof(
    request: Request,
    registration_id: str,
    ttl_seconds: int,
) -> str:
    now = int(time.time())
    verification_proof_id = str(uuid.uuid4())

    proof_store = _get_fido2_delete_proof_store(request)
    proof_store = _prune_expired_fido2_delete_proofs(proof_store)
    proof_store[verification_proof_id] = {
        "expiresAt": now + ttl_seconds,
        "registrationId": registration_id,
    }

    request.session[FIDO2_DELETE_VERIFICATION_PROOFS_SESSION_KEY] = proof_store
    return verification_proof_id


def _consume_fido2_delete_verification_proof_or_raise(
    request: Request,
    verification_proof_id: str,
    registration_id: str,
) -> None:
    proof_store = _get_fido2_delete_proof_store(request)
    proof_store = _prune_expired_fido2_delete_proofs(proof_store)
    proof_data = proof_store.get(verification_proof_id)

    if proof_data is None:
        request.session[FIDO2_DELETE_VERIFICATION_PROOFS_SESSION_KEY] = proof_store
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="otp_expired",
        )

    expires_at = proof_data.get("expiresAt")
    if not isinstance(expires_at, int) or expires_at <= int(time.time()):
        proof_store.pop(verification_proof_id, None)
        request.session[FIDO2_DELETE_VERIFICATION_PROOFS_SESSION_KEY] = proof_store
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="otp_expired",
        )

    if proof_data.get("registrationId") != registration_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalidCode",
        )

    proof_store.pop(verification_proof_id, None)
    request.session[FIDO2_DELETE_VERIFICATION_PROOFS_SESSION_KEY] = proof_store


def _parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    normalized_value = value.strip()
    if normalized_value.endswith("Z"):
        normalized_value = normalized_value[:-1] + "+00:00"

    try:
        parsed_datetime = datetime.fromisoformat(normalized_value)
    except ValueError:
        return None

    if parsed_datetime.tzinfo is None:
        return parsed_datetime.replace(tzinfo=timezone.utc)

    return parsed_datetime.astimezone(timezone.utc)


async def _get_fido2_delete_otp_proof_ttl_seconds(
    request: Request,
    trxn_id: str,
    otp_type,
    user_access_token: str,
) -> int:
    try:
        status_response = await dispatch_otp_status_retrieval(
            request.app.state.request_client,
            RetrievalData(trxnId=trxn_id, otpType=otp_type),
            user_access_token,
        )
    except Exception as e:
        logger.warning(
            "Unable to resolve OTP status for passkey delete TTL: %s", str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="otp_expired",
        )

    if status_response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="otp_expired",
        )

    otp_expiry_datetime = _parse_iso_datetime(status_response.json().get("expiry"))
    if otp_expiry_datetime is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="otp_expired",
        )

    remaining_seconds = int(
        (otp_expiry_datetime - datetime.now(timezone.utc)).total_seconds()
    )
    if remaining_seconds <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="otp_expired",
        )

    return remaining_seconds


def _get_fido2_delete_passkey_proof_ttl_seconds() -> int:
    session_lifetime = get_configuration().session_config.SESSION_LIFETIME
    try:
        ttl_seconds = int(session_lifetime)
    except (TypeError, ValueError):
        ttl_seconds = 0

    if ttl_seconds <= 0:
        ttl_seconds = 60

    return ttl_seconds


async def _verify_assertion_or_raise(
    request: Request,
    http_client: AsyncClient,
    user_access_token: str,
    assertion_result,
) -> None:
    try:
        assertion_response = await submit_assertion_result(
            request=request,
            http_client=http_client,
            user_access_token=user_access_token,
            request_body=assertion_result,
            return_jwt=False,
        )
    except HTTPStatusError as e:
        if e.response is not None and e.response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_401_UNAUTHORIZED,
        ]:
            body = extract_response_body(e.response)
            message_id = body.get("messageId")
            if message_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=message_id,
                )
        raise

    if not assertion_response.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalidCode",
        )


async def delete_registration(
    request: Request,
    http_client: AsyncClient,
    user_access_token: str,
    request_data: DeleteRegistrationRequest,
) -> ResponseModel:
    """Delete a FIDO2 registration with action-based verification modes."""
    tenant_url = get_tenant_url()
    registration_id = request_data.id

    if request_data.action == DeleteRegistrationRequest.Action.VERIFY:
        proof_ttl_seconds = _get_fido2_delete_passkey_proof_ttl_seconds()
        if request_data.assertionResult is not None:
            logger.info("Verifying FIDO2 authentication before deletion")
            await _verify_assertion_or_raise(
                request=request,
                http_client=http_client,
                user_access_token=user_access_token,
                assertion_result=request_data.assertionResult,
            )
            logger.info("FIDO2 authentication verified successfully")
        else:
            proof_ttl_seconds = await _get_fido2_delete_otp_proof_ttl_seconds(
                request=request,
                trxn_id=request_data.trxnId,
                otp_type=request_data.otpVerificationType,
                user_access_token=user_access_token,
            )
            logger.info("Verifying OTP before deletion")
            await verify_otp_before_operation(
                global_http_client=http_client,
                otp=request_data.otp,
                trxn_id=request_data.trxnId,
                otp_type=request_data.otpVerificationType,
                user_access_token=user_access_token,
            )
            logger.info("OTP verified successfully")

        # Get user ID from token and verify ownership before issuing proof.
        _username, _display_name, user_id = await get_user_profile_info(
            http_client, user_access_token
        )
        await verify_registration_ownership(
            http_client, user_access_token, registration_id, user_id
        )
        await assert_remaining_mfa_factor_after_deletion(
            http_client=http_client,
            user_access_token=user_access_token,
            fido2_registration_ids_to_delete={registration_id},
        )

        verification_proof_id = _store_fido2_delete_verification_proof(
            request=request,
            registration_id=registration_id,
            ttl_seconds=proof_ttl_seconds,
        )

        return ResponseModel(
            success=True,
            message="FIDO2 deletion verification successful",
            data={
                "verificationProofId": verification_proof_id,
                "expiresIn": proof_ttl_seconds,
            },
        )

    if request_data.action == DeleteRegistrationRequest.Action.COMMIT:
        _consume_fido2_delete_verification_proof_or_raise(
            request=request,
            verification_proof_id=request_data.verificationProofId,
            registration_id=registration_id,
        )

    elif request_data.assertionResult is not None:
        logger.info("Verifying FIDO2 authentication before deletion")
        await _verify_assertion_or_raise(
            request=request,
            http_client=http_client,
            user_access_token=user_access_token,
            assertion_result=request_data.assertionResult,
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

    await assert_remaining_mfa_factor_after_deletion(
        http_client=http_client,
        user_access_token=user_access_token,
        fido2_registration_ids_to_delete={registration_id},
    )

    # Step 3: Delete the registration
    reg_url = (
        f"{tenant_url}{VerifyAPIEndpoint.FIDO2_REGISTRATIONS.value}/{registration_id}"
    )
    profile = await dispatch_get_my_profile_from_ibm(http_client, user_access_token)
    user_language = profile.preferredLanguage or "en"
    headers = get_auth_request_headers(
        user_access_token, json_content_type=True, language=user_language
    )

    delete_response = await http_client.delete(reg_url, headers=headers)
    delete_response.raise_for_status()

    logger.info(f"Registration deleted: {registration_id}")

    # Return success response (IBM Verify API returns 204 No Content on success)
    return ResponseModel(
        success=True,
        message="FIDO2 registration deleted successfully",
    )
