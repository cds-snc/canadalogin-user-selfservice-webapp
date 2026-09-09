import logging
import time
import uuid
from datetime import datetime, timezone
from urllib.parse import quote

from app.config import get_configuration
from app.fido2.services.authenticate_fido2_registration import submit_assertion_result
from app.otp.schemas import (
    OtpDeletionAction,
    OtpBatchDeletionRequest,
    OtpDeletionRequest,
    OtpType,
    RetrievalData,
)
from app.otp.services.retrieve_transient_otp import dispatch_otp_status_retrieval
from app.users.services.get_my_profile import get_my_profile
from app.users.services.mfa_delete_guard import (
    assert_remaining_mfa_factor_after_deletion,
)
from app.users.services.otp_factors import get_user_otp_factors
from app.utils.access_token import get_auth_request_headers
from app.utils.global_error_handlers import extract_response_body
from app.utils.schemas import ResponseModel
from app.utils.helpers import verify_otp_before_operation
from fastapi import HTTPException, Request, status
from httpx import AsyncClient, HTTPStatusError

logger = logging.getLogger(__name__)

MFA_DELETE_VERIFICATION_PROOFS_SESSION_KEY = "mfa_delete_verification_proofs"


def _append_theme_id_query(url: str, theme_id: str | None) -> str:
    if not theme_id:
        return url

    normalized_theme_id = theme_id.strip()
    if not normalized_theme_id:
        return url

    return f"{url}?themeId={quote(normalized_theme_id, safe='')}"


def _get_endpoint_for_otp_type(otp_type: OtpType) -> str:
    """Helper function to determine the endpoint based on OTP type"""
    if otp_type == OtpType.SMS:
        return "smsotp"
    elif otp_type == OtpType.VOICE:
        return "voiceotp"
    elif otp_type == OtpType.EMAIL:
        return "emailotp"
    else:
        return "unknown"


def _build_single_delete_fingerprint(
    deletion_request: OtpDeletionRequest,
) -> dict[str, str | list[str]]:
    return {
        "mode": "single",
        "factorIds": [deletion_request.id],
        "otpTypes": [deletion_request.otpType.value],
    }


def _build_batch_delete_fingerprint(
    deletion_request: OtpBatchDeletionRequest,
) -> dict[str, str | list[dict[str, str]]]:
    normalized_factors = [
        {"id": factor.id, "otpType": factor.otpType.value}
        for factor in deletion_request.factors
    ]
    normalized_factors.sort(key=lambda item: (item["id"], item["otpType"]))

    return {
        "mode": "batch",
        "factors": normalized_factors,
    }


def _get_mfa_delete_proof_store(request: Request) -> dict[str, dict]:
    proof_store = request.session.get(MFA_DELETE_VERIFICATION_PROOFS_SESSION_KEY, {})
    if isinstance(proof_store, dict):
        return proof_store
    return {}


def _prune_expired_mfa_delete_proofs(proof_store: dict[str, dict]) -> dict[str, dict]:
    now = int(time.time())
    pruned_store: dict[str, dict] = {}

    for proof_id, proof_data in proof_store.items():
        if not isinstance(proof_data, dict):
            continue

        expires_at = proof_data.get("expiresAt")
        if isinstance(expires_at, int) and expires_at > now:
            pruned_store[proof_id] = proof_data

    return pruned_store


def _store_mfa_delete_verification_proof(
    request: Request,
    fingerprint: dict,
    ttl_seconds: int,
) -> str:
    now = int(time.time())
    verification_proof_id = str(uuid.uuid4())

    proof_store = _get_mfa_delete_proof_store(request)
    proof_store = _prune_expired_mfa_delete_proofs(proof_store)
    proof_store[verification_proof_id] = {
        "expiresAt": now + ttl_seconds,
        "fingerprint": fingerprint,
    }

    request.session[MFA_DELETE_VERIFICATION_PROOFS_SESSION_KEY] = proof_store
    return verification_proof_id


def _consume_mfa_delete_verification_proof_or_raise(
    request: Request,
    verification_proof_id: str,
    expected_fingerprint: dict,
) -> None:
    proof_store = _get_mfa_delete_proof_store(request)
    proof_store = _prune_expired_mfa_delete_proofs(proof_store)
    proof_data = proof_store.get(verification_proof_id)

    if proof_data is None:
        request.session[MFA_DELETE_VERIFICATION_PROOFS_SESSION_KEY] = proof_store
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="otp_expired",
        )

    expires_at = proof_data.get("expiresAt")
    if not isinstance(expires_at, int) or expires_at <= int(time.time()):
        proof_store.pop(verification_proof_id, None)
        request.session[MFA_DELETE_VERIFICATION_PROOFS_SESSION_KEY] = proof_store
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="otp_expired",
        )

    actual_fingerprint = proof_data.get("fingerprint")
    if actual_fingerprint != expected_fingerprint:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalidCode",
        )

    proof_store.pop(verification_proof_id, None)
    request.session[MFA_DELETE_VERIFICATION_PROOFS_SESSION_KEY] = proof_store


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


async def _get_mfa_delete_otp_proof_ttl_seconds(
    request: Request,
    trxn_id: str,
    otp_type: OtpType,
    user_access_token: str,
) -> int:
    try:
        status_response = await dispatch_otp_status_retrieval(
            request.app.state.request_client,
            RetrievalData(trxnId=trxn_id, otpType=otp_type),
            user_access_token,
        )
    except Exception as e:
        logger.warning("Unable to resolve OTP status for delete proof TTL: %s", str(e))
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


def _get_mfa_delete_passkey_proof_ttl_seconds() -> int:
    session_lifetime = get_configuration().session_config.SESSION_LIFETIME
    try:
        ttl_seconds = int(session_lifetime)
    except (TypeError, ValueError):
        ttl_seconds = 0

    if ttl_seconds <= 0:
        ttl_seconds = 60

    return ttl_seconds


async def _verify_passkey_assertion_or_raise(
    request: Request,
    global_http_client: AsyncClient,
    user_access_token: str,
    assertion_result,
) -> None:
    try:
        assertion_response = await submit_assertion_result(
            request=request,
            http_client=global_http_client,
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


async def handle_otp_deletion(
    global_http_client: AsyncClient,
    deletion_request: OtpDeletionRequest,
    user_access_token: str,
    request: Request | None = None,
):
    """Delete an OTP factor enrollment (SMS, Voice, or Email) after OTP verification.

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

    if deletion_request.action == OtpDeletionAction.VERIFY:
        if request is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Request context required for verification",
            )

        proof_ttl_seconds = _get_mfa_delete_passkey_proof_ttl_seconds()
        if deletion_request.assertionResult is not None:
            await _verify_passkey_assertion_or_raise(
                request=request,
                global_http_client=global_http_client,
                user_access_token=user_access_token,
                assertion_result=deletion_request.assertionResult,
            )
        else:
            proof_ttl_seconds = await _get_mfa_delete_otp_proof_ttl_seconds(
                request=request,
                trxn_id=deletion_request.trxnId,
                otp_type=deletion_request.otpVerificationType,
                user_access_token=user_access_token,
            )
            await verify_otp_before_operation(
                global_http_client=global_http_client,
                user_access_token=user_access_token,
                otp=deletion_request.otp,
                trxn_id=deletion_request.trxnId,
                otp_type=deletion_request.otpVerificationType,
            )

        await assert_remaining_mfa_factor_after_deletion(
            http_client=global_http_client,
            user_access_token=user_access_token,
            otp_factor_ids_to_delete={deletion_request.id},
        )

        verification_proof_id = _store_mfa_delete_verification_proof(
            request=request,
            fingerprint=_build_single_delete_fingerprint(deletion_request),
            ttl_seconds=proof_ttl_seconds,
        )
        return ResponseModel(
            success=True,
            data={
                "verificationProofId": verification_proof_id,
                "expiresIn": proof_ttl_seconds,
            },
            message="MFA deletion verification successful",
        )

    if deletion_request.action == OtpDeletionAction.COMMIT:
        if request is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Request context required for verification proof",
            )

        _consume_mfa_delete_verification_proof_or_raise(
            request=request,
            verification_proof_id=deletion_request.verificationProofId,
            expected_fingerprint=_build_single_delete_fingerprint(deletion_request),
        )

        await assert_remaining_mfa_factor_after_deletion(
            http_client=global_http_client,
            user_access_token=user_access_token,
            otp_factor_ids_to_delete={deletion_request.id},
        )

    elif deletion_request.otp is None and deletion_request.assertionResult is None:
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
            await _verify_passkey_assertion_or_raise(
                request=request,
                global_http_client=global_http_client,
                user_access_token=user_access_token,
                assertion_result=deletion_request.assertionResult,
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

        await assert_remaining_mfa_factor_after_deletion(
            http_client=global_http_client,
            user_access_token=user_access_token,
            otp_factor_ids_to_delete={deletion_request.id},
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
            "Unable to delete MFA factor",
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

    if deletion_request.action == OtpDeletionAction.VERIFY:
        if request is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Request context required for verification",
            )

        proof_ttl_seconds = _get_mfa_delete_passkey_proof_ttl_seconds()
        if deletion_request.assertionResult is not None:
            await _verify_passkey_assertion_or_raise(
                request=request,
                global_http_client=global_http_client,
                user_access_token=user_access_token,
                assertion_result=deletion_request.assertionResult,
            )
        else:
            proof_ttl_seconds = await _get_mfa_delete_otp_proof_ttl_seconds(
                request=request,
                trxn_id=deletion_request.trxnId,
                otp_type=deletion_request.otpVerificationType,
                user_access_token=user_access_token,
            )
            await verify_otp_before_operation(
                global_http_client=global_http_client,
                user_access_token=user_access_token,
                otp=deletion_request.otp,
                trxn_id=deletion_request.trxnId,
                otp_type=deletion_request.otpVerificationType,
            )

        await assert_remaining_mfa_factor_after_deletion(
            http_client=global_http_client,
            user_access_token=user_access_token,
            otp_factor_ids_to_delete={factor.id for factor in deletion_request.factors},
        )

        verification_proof_id = _store_mfa_delete_verification_proof(
            request=request,
            fingerprint=_build_batch_delete_fingerprint(deletion_request),
            ttl_seconds=proof_ttl_seconds,
        )
        return ResponseModel(
            success=True,
            data={
                "verificationProofId": verification_proof_id,
                "expiresIn": proof_ttl_seconds,
            },
            message="MFA deletion verification successful",
        )

    if deletion_request.action == OtpDeletionAction.COMMIT:
        if request is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Request context required for verification proof",
            )

        _consume_mfa_delete_verification_proof_or_raise(
            request=request,
            verification_proof_id=deletion_request.verificationProofId,
            expected_fingerprint=_build_batch_delete_fingerprint(deletion_request),
        )

    elif deletion_request.assertionResult is not None:
        if request is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Request context required for passkey verification",
            )

        await _verify_passkey_assertion_or_raise(
            request=request,
            global_http_client=global_http_client,
            user_access_token=user_access_token,
            assertion_result=deletion_request.assertionResult,
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

    await assert_remaining_mfa_factor_after_deletion(
        http_client=global_http_client,
        user_access_token=user_access_token,
        otp_factor_ids_to_delete={factor.id for factor in deletion_request.factors},
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
    theme_id: str | None = None,
):
    """Dispatch OTP deletion to IBM Verify (SMS, Voice, or Email)."""
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
    if endpoint == "emailotp":
        deletion_url = _append_theme_id_query(deletion_url, theme_id)

    logger.info("Calling IBM Verify DELETE")

    response = await global_http_client.delete(deletion_url, headers=headers)
    response.raise_for_status()
    return response
