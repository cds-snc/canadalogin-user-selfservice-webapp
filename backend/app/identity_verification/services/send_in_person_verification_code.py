import logging
import json
import hashlib

from datetime import UTC, datetime

from fastapi import HTTPException, Request, status
from httpx import AsyncClient

from app.config import GCNotifyConfig
from app.constants.gc_notify import (
    GC_NOTIFY_BASE_URL,
    GCNotifyEndpoint,
    GCNotifyTemplateID,
)
from app.identity_verification.services.generate_unique_verification_code import (
    generate_unique_verification_code,
)
from app.users.services.get_my_profile import dispatch_get_my_profile_from_ibm
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.redis import get_redis_client
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)

_gc_notify_config = GCNotifyConfig()

GC_NOTIFY_EMAIL_ENDPOINT = f"{GC_NOTIFY_BASE_URL}{GCNotifyEndpoint.SEND_EMAIL.value}"

IP_WINDOW_SECONDS = 60
IP_WINDOW_LIMIT = 20
USER_COOLDOWN_SECONDS = 60
USER_DAILY_LIMIT = 10
USER_DAILY_WINDOW_SECONDS = 24 * 60 * 60

IP_RATE_LIMIT_KEY_PREFIX = "idv:in_person:ip"
USER_COOLDOWN_KEY_PREFIX = "idv:in_person:cooldown"
USER_DAILY_KEY_PREFIX = "idv:in_person:daily"
USER_ACTIVE_CODE_KEY_PREFIX = "idv:in_person:active_code"
USER_EMAIL_SENT_KEY_PREFIX = "idv:in_person:email_sent"


def _build_rate_limit_error(reason: str, retry_after_seconds: int) -> HTTPException:
    retry_after = max(retry_after_seconds, 1)
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail={
            "messageId": "TooManyRequests",
            "reason": reason,
            "retry_after_seconds": retry_after,
        },
        headers={"Retry-After": str(retry_after)},
    )


def _get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _hash_user_identifier(identifier: str) -> str:
    return hashlib.sha256(identifier.strip().lower().encode("utf-8")).hexdigest()


def _hash_ip(ip_address: str) -> str:
    return hashlib.sha256(ip_address.encode("utf-8")).hexdigest()


def _parse_iso_datetime(value: str | bytes) -> datetime | None:
    try:
        # Decode bytes to str if needed (Redis may return bytes)
        if isinstance(value, bytes):
            value = value.decode("utf-8")
        parsed = datetime.fromisoformat(value)
    except (ValueError, TypeError, AttributeError):
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed


async def _enforce_ip_rate_limit(redis_client, client_ip: str) -> None:
    ip_key = f"{IP_RATE_LIMIT_KEY_PREFIX}:{client_ip}"
    ip_count = await redis_client.incr(ip_key)

    if ip_count == 1:
        await redis_client.expire(ip_key, IP_WINDOW_SECONDS)

    if ip_count > IP_WINDOW_LIMIT:
        retry_after = await redis_client.ttl(ip_key)
        if retry_after <= 0:
            retry_after = IP_WINDOW_SECONDS
        logger.warning(
            "IDV in-person send blocked by IP rate limit (ip_hash=%s, count=%s)",
            _hash_ip(client_ip),
            ip_count,
        )
        raise _build_rate_limit_error("ip_limit", retry_after)


async def _enforce_user_limits(redis_client, user_hash: str) -> None:
    daily_key = f"{USER_DAILY_KEY_PREFIX}:{user_hash}"
    cooldown_key = f"{USER_COOLDOWN_KEY_PREFIX}:{user_hash}"

    daily_raw = await redis_client.get(daily_key)
    daily_count = int(daily_raw) if daily_raw else 0
    if daily_count >= USER_DAILY_LIMIT:
        retry_after = await redis_client.ttl(daily_key)
        if retry_after <= 0:
            retry_after = USER_DAILY_WINDOW_SECONDS
        logger.warning(
            "IDV in-person send blocked by daily user limit (user_hash=%s, count=%s)",
            user_hash,
            daily_count,
        )
        raise _build_rate_limit_error("user_daily_limit", retry_after)

    cooldown_ttl = await redis_client.ttl(cooldown_key)
    if cooldown_ttl > 0:
        logger.warning(
            "IDV in-person send blocked by user cooldown (user_hash=%s, retry_after=%s)",
            user_hash,
            cooldown_ttl,
        )
        raise _build_rate_limit_error("user_cooldown", cooldown_ttl)


async def _get_cached_active_code(redis_client, user_hash: str) -> dict | None:
    active_key = f"{USER_ACTIVE_CODE_KEY_PREFIX}:{user_hash}"
    raw = await redis_client.get(active_key)
    if not raw:
        return None

    try:
        cached = json.loads(raw)
    except json.JSONDecodeError:
        await redis_client.delete(active_key)
        return None

    expires_at_raw = cached.get("expires_at")
    verification_code = cached.get("verification_code")
    if not expires_at_raw or not verification_code:
        await redis_client.delete(active_key)
        return None

    expires_at = _parse_iso_datetime(expires_at_raw)
    if not expires_at or expires_at <= datetime.now(UTC):
        await redis_client.delete(active_key)
        return None

    return {
        "verification_code": verification_code,
        "expires_at": expires_at,
        "validity_days": cached.get("validity_days"),
    }


async def _cache_active_code(
    redis_client,
    user_hash: str,
    verification_code: str,
    expires_at: datetime,
    validity_days: int,
) -> None:
    ttl_seconds = int((expires_at - datetime.now(UTC)).total_seconds())
    ttl_seconds = max(ttl_seconds, 1)
    active_key = f"{USER_ACTIVE_CODE_KEY_PREFIX}:{user_hash}"
    await redis_client.setex(
        active_key,
        ttl_seconds,
        json.dumps(
            {
                "verification_code": verification_code,
                "expires_at": expires_at.isoformat(),
                "validity_days": validity_days,
            }
        ),
    )


async def _mark_successful_send(
    redis_client, user_hash: str, sent_at: datetime | None = None
) -> None:
    cooldown_key = f"{USER_COOLDOWN_KEY_PREFIX}:{user_hash}"
    daily_key = f"{USER_DAILY_KEY_PREFIX}:{user_hash}"
    email_sent_key = f"{USER_EMAIL_SENT_KEY_PREFIX}:{user_hash}"

    await redis_client.setex(cooldown_key, USER_COOLDOWN_SECONDS, "1")
    daily_count = await redis_client.incr(daily_key)
    if daily_count == 1:
        await redis_client.expire(daily_key, USER_DAILY_WINDOW_SECONDS)

    # Store the last email sent timestamp
    if sent_at is not None:
        await redis_client.setex(
            email_sent_key, USER_DAILY_WINDOW_SECONDS, sent_at.isoformat()
        )


async def get_last_email_sent_time(
    redis_client, user_hash: str
) -> datetime | None:
    """Retrieves the timestamp of the last email sent to the user.
    
    Args:
        redis_client: Redis client instance
        user_hash: Hashed user identifier
        
    Returns:
        datetime of last email sent, or None if no email has been sent yet
    """
    email_sent_key = f"{USER_EMAIL_SENT_KEY_PREFIX}:{user_hash}"
    sent_at_str = await redis_client.get(email_sent_key)
    
    if sent_at_str is None:
        return None
    
    return _parse_iso_datetime(sent_at_str)


async def send_in_person_verification_code(
    global_http_client: AsyncClient,
    user_access_token: str,
    request: Request | None = None,
) -> ResponseModel:
    """Sends an in-person identity verification email via GC Notify containing
    a verification code the user must present at a Service Canada Centre.
    """

    if not _gc_notify_config.GC_NOTIFY_API_KEY:
        logger.error("GC_NOTIFY_API_KEY is not configured")
        raise RequestErrorHandler.handle(
            ValueError("GC Notify API key is not configured"),
            context="GC Notify in-person verification email",
        )

    redis_client = None
    client_ip = "unknown"
    if request is not None:
        client_ip = _get_client_ip(request)
        try:
            redis_client = get_redis_client(request)
            await _enforce_ip_rate_limit(redis_client, client_ip)
        except ValueError:
            logger.warning("Redis unavailable; IP throttling disabled for IDV endpoint")

    profile = await dispatch_get_my_profile_from_ibm(
        global_http_client, user_access_token
    )
    email_address = profile.userName
    user_hash = _hash_user_identifier(email_address)

    verification_code: str
    verification_expires_at: datetime
    verification_validity_days: int

    if redis_client is not None:
        await _enforce_user_limits(redis_client, user_hash)
        cached_code = await _get_cached_active_code(redis_client, user_hash)
        if cached_code is not None:
            verification_code = cached_code["verification_code"]
            verification_expires_at = cached_code["expires_at"]
            verification_validity_days = int(cached_code.get("validity_days") or 30)
            logger.info(
                "Reusing active in-person verification code (user_hash=%s, expires_at=%s)",
                user_hash,
                verification_expires_at.isoformat(),
            )
        else:
            verification_payload = generate_unique_verification_code()
            verification_code = verification_payload.identifier
            verification_expires_at = verification_payload.expires_at
            verification_validity_days = verification_payload.validity_days
            await _cache_active_code(
                redis_client,
                user_hash,
                verification_code,
                verification_expires_at,
                verification_validity_days,
            )
    else:
        verification_payload = generate_unique_verification_code()
        verification_code = verification_payload.identifier
        verification_expires_at = verification_payload.expires_at
        verification_validity_days = verification_payload.validity_days

    headers = {
        "Authorization": f"ApiKey-v1 {_gc_notify_config.GC_NOTIFY_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "email_address": email_address,
        "template_id": GCNotifyTemplateID.IN_PERSON_VERIFICATION.value,
        "personalisation": {
            "verification_code": verification_code,
        },
    }

    try:
        response = await global_http_client.post(
            GC_NOTIFY_EMAIL_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
    except Exception as exc:
        raise RequestErrorHandler.handle(
            exc, context="GC Notify in-person verification email"
        )

    logger.info(
        "In-person verification email sent (user_hash=%s)",
        user_hash,
    )

    sent_at = datetime.now(UTC)

    if redis_client is not None:
        await _mark_successful_send(redis_client, user_hash, sent_at)

    logger.info(
        "IDV in-person verification send completed (user_hash=%s, ip_hash=%s)",
        user_hash,
        _hash_ip(client_ip),
    )

    return ResponseModel(
        success=True,
        message="In-person verification email sent",
        data={
            "verification_code": verification_code,
            "verification_expires_at": verification_expires_at.isoformat(),
            "verification_validity_days": verification_validity_days,
            "sent_at": sent_at.isoformat(),
        },
    )
