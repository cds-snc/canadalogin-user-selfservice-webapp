import hashlib
import hmac
import logging
import time
from typing import Any

from app.config import get_configuration
from fastapi import HTTPException, Request, status

logger = logging.getLogger(__name__)

PHONE_RATE_LIMIT = 5
PHONE_RATE_LIMIT_WINDOW_SECONDS_PROD = 24 * 60 * 60
PHONE_RATE_LIMIT_WINDOW_SECONDS_NON_PROD = 15 * 60
PHONE_RATE_LIMIT_ERROR_CODE = "phone_mfa_change_rate_limit"

PHONE_MFA_REGISTRATION_SESSION_KEY = "phone_mfa_registration_events"
PHONE_MFA_REGISTRATION_REDIS_KEY_PREFIX = "rate_limit:phone_mfa_registration:"

CONTACT_PHONE_UPDATE_SESSION_KEY = "contact_phone_update_events"
CONTACT_PHONE_UPDATE_REDIS_KEY_PREFIX = "rate_limit:contact_phone_update:"

OTP_SEND_DAILY_LIMIT = 30
OTP_SEND_DAILY_WINDOW_SECONDS_PROD = 24 * 60 * 60
OTP_SEND_DAILY_WINDOW_SECONDS_NON_PROD = 15 * 60
OTP_SEND_DAILY_REDIS_KEY_PREFIX = "rate_limit:otp_send_daily:"
OTP_SEND_DAILY_ERROR_CODE = "otp_send_daily_limit"
OTP_SEND_LIMITER_UNAVAILABLE_ERROR_CODE = "otp_send_limiter_unavailable"
OTP_SEND_DAILY_SESSION_KEY = "otp_send_daily_events"

OTP_SEND_MFA_FIELD = "mfa_send_count"
OTP_SEND_TRANSIENT_FIELD = "transient_send_count"
OTP_SEND_WINDOW_START_FIELD = "window_start"


def _get_rate_limit_window_seconds() -> int:
    environment = get_configuration().ENVIRONMENT.strip().lower()

    if environment in {"staging", "prod"}:
        return PHONE_RATE_LIMIT_WINDOW_SECONDS_PROD

    if environment in {"local", "dev", "test"}:
        return PHONE_RATE_LIMIT_WINDOW_SECONDS_NON_PROD

    # Fail closed to production-level limits for unknown environments.
    return PHONE_RATE_LIMIT_WINDOW_SECONDS_PROD


def _get_otp_send_daily_window_seconds() -> int:
    environment = getattr(get_configuration(), "ENVIRONMENT", "local").strip().lower()

    if environment in {"local", "dev", "test"}:
        return OTP_SEND_DAILY_WINDOW_SECONDS_NON_PROD

    # Keep the daily quota at 24 hours for staging, production, and unknown environments.
    return OTP_SEND_DAILY_WINDOW_SECONDS_PROD


def _hash_user_id_for_rate_limit(user_id: str) -> str:
    configuration = get_configuration()
    session_config = getattr(configuration, "session_config", None)
    secret = getattr(session_config, "REDIS_AUTH_SECRET", "test-secret")
    digest = hmac.new(
        str(secret).encode("utf-8"),
        str(user_id).encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return digest[:40]


def _build_otp_send_daily_key(user_id: str, endpoint_field: str) -> str:
    user_hash = _hash_user_id_for_rate_limit(user_id)
    return f"{OTP_SEND_DAILY_REDIS_KEY_PREFIX}{endpoint_field}:{user_hash}"


def _is_otp_send_session_fallback_environment() -> bool:
    environment = getattr(get_configuration(), "ENVIRONMENT", "local").strip().lower()
    return environment in {"local", "dev", "test"}


def _otp_send_retry_after(now: int, window_start: int) -> int:
    return max(
        1,
        _get_otp_send_daily_window_seconds() - (now - window_start),
    )


def _raise_otp_send_daily_limit(
    endpoint_field: str,
    user_hash: str,
    retry_after: int,
) -> None:
    logger.warning(
        "OTP send daily limit reached: endpoint_bucket=%s user_hash=%s retry_after=%s",
        endpoint_field,
        user_hash,
        retry_after,
    )
    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail=OTP_SEND_DAILY_ERROR_CODE,
        headers={"Retry-After": str(retry_after)},
    )


def _consume_otp_send_daily_quota_from_session(
    request: Request,
    user_id: str,
    endpoint_field: str,
) -> None:
    now = int(time.time())
    event_store = request.session.get(OTP_SEND_DAILY_SESSION_KEY, {})
    if not isinstance(event_store, dict):
        event_store = {}

    user_key = _hash_user_id_for_rate_limit(user_id)
    entry = event_store.get(user_key, {})
    if not isinstance(entry, dict):
        entry = {}

    window_start = entry.get(OTP_SEND_WINDOW_START_FIELD)
    window_seconds = _get_otp_send_daily_window_seconds()
    if not isinstance(window_start, int) or now - window_start >= window_seconds:
        window_start = now
        entry = {
            OTP_SEND_WINDOW_START_FIELD: window_start,
            OTP_SEND_MFA_FIELD: 0,
            OTP_SEND_TRANSIENT_FIELD: 0,
        }

    count = entry.get(endpoint_field, 0)
    if not isinstance(count, int):
        count = 0

    if count >= OTP_SEND_DAILY_LIMIT:
        _raise_otp_send_daily_limit(
            endpoint_field,
            user_key,
            _otp_send_retry_after(now, window_start),
        )

    entry[endpoint_field] = count + 1
    event_store[user_key] = entry
    request.session[OTP_SEND_DAILY_SESSION_KEY] = event_store


async def _consume_otp_send_daily_quota(
    request: Request,
    user_id: str,
    endpoint_field: str,
) -> None:
    redis_client = _get_redis_client_from_request(request)
    if redis_client is None:
        if _is_otp_send_session_fallback_environment():
            _consume_otp_send_daily_quota_from_session(request, user_id, endpoint_field)
            return
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=OTP_SEND_LIMITER_UNAVAILABLE_ERROR_CODE,
        )

    window_seconds = _get_otp_send_daily_window_seconds()
    key = _build_otp_send_daily_key(user_id, endpoint_field)
    try:
        count = int(await redis_client.incr(key))
        if count == 1:
            await redis_client.expire(key, window_seconds)

        if count > OTP_SEND_DAILY_LIMIT:
            retry_after = int(await redis_client.ttl(key))
            if retry_after < 1:
                retry_after = window_seconds
            _raise_otp_send_daily_limit(
                endpoint_field,
                _hash_user_id_for_rate_limit(user_id),
                retry_after,
            )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001 - environment policy decides fallback
        if _is_otp_send_session_fallback_environment():
            logger.warning(
                "OTP send limiter unavailable, falling back to session: %s", exc
            )
            _consume_otp_send_daily_quota_from_session(request, user_id, endpoint_field)
            return

        logger.error("OTP send limiter unavailable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=OTP_SEND_LIMITER_UNAVAILABLE_ERROR_CODE,
        ) from exc


async def consume_mfa_send_daily_quota(request: Request, user_id: str) -> None:
    await _consume_otp_send_daily_quota(request, user_id, OTP_SEND_MFA_FIELD)


async def consume_transient_send_daily_quota(request: Request, user_id: str) -> None:
    await _consume_otp_send_daily_quota(request, user_id, OTP_SEND_TRANSIENT_FIELD)


def _build_rate_limit_key(redis_key_prefix: str, user_id: str) -> str:
    return f"{redis_key_prefix}{user_id}"


def _prune_expired_session_events(
    events: list[int],
    now: int,
    window_seconds: int,
) -> list[int]:
    cutoff = now - window_seconds
    return [event_time for event_time in events if event_time > cutoff]


def _get_session_event_store(
    request: Request,
    session_key: str,
) -> dict[str, list[int]]:
    event_store = request.session.get(session_key, {})
    if not isinstance(event_store, dict):
        return {}

    normalized_store: dict[str, list[int]] = {}
    for user_key, timestamps in event_store.items():
        if not isinstance(user_key, str) or not isinstance(timestamps, list):
            continue
        normalized_store[user_key] = [
            int(ts) for ts in timestamps if isinstance(ts, int) or isinstance(ts, float)
        ]

    return normalized_store


def _store_session_event_store(
    request: Request,
    session_key: str,
    event_store: dict[str, list[int]],
) -> None:
    request.session[session_key] = event_store


def _assert_session_rate_limit_not_exceeded(
    request: Request,
    user_id: str,
    session_key: str,
    allow_at_limit: bool = False,
) -> None:
    now = int(time.time())
    window_seconds = _get_rate_limit_window_seconds()
    event_store = _get_session_event_store(request, session_key)
    user_events = _prune_expired_session_events(
        event_store.get(user_id, []), now, window_seconds
    )
    event_store[user_id] = user_events
    _store_session_event_store(request, session_key, event_store)

    if len(user_events) > PHONE_RATE_LIMIT or (
        not allow_at_limit and len(user_events) >= PHONE_RATE_LIMIT
    ):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=PHONE_RATE_LIMIT_ERROR_CODE,
        )


def _record_session_event(
    request: Request,
    user_id: str,
    session_key: str,
) -> None:
    now = int(time.time())
    window_seconds = _get_rate_limit_window_seconds()
    event_store = _get_session_event_store(request, session_key)
    user_events = _prune_expired_session_events(
        event_store.get(user_id, []), now, window_seconds
    )
    user_events.append(now)
    event_store[user_id] = user_events
    _store_session_event_store(request, session_key, event_store)


def _get_redis_client_from_request(request: Request) -> Any:
    app = getattr(request, "app", None)
    state = getattr(app, "state", None)
    return getattr(state, "redis_client", None)


async def _assert_rate_limit_not_exceeded(
    request: Request,
    user_id: str,
    session_key: str,
    redis_key_prefix: str,
    allow_at_limit: bool = False,
) -> None:
    redis_client = _get_redis_client_from_request(request)
    if redis_client is None:
        _assert_session_rate_limit_not_exceeded(
            request, user_id, session_key, allow_at_limit
        )
        return

    key = _build_rate_limit_key(redis_key_prefix, user_id)

    try:
        raw_count = await redis_client.get(key)
        if raw_count is None:
            return

        if isinstance(raw_count, bytes):
            count = int(raw_count.decode("utf-8"))
        else:
            count = int(raw_count)

        if count > PHONE_RATE_LIMIT or (
            not allow_at_limit and count >= PHONE_RATE_LIMIT
        ):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=PHONE_RATE_LIMIT_ERROR_CODE,
            )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001 - fail open when limiter is unavailable
        logger.warning(
            "Phone rate-limit check failed, falling back to session: %s",
            str(exc),
        )
        _assert_session_rate_limit_not_exceeded(
            request, user_id, session_key, allow_at_limit
        )


async def _record_rate_limit_event(
    request: Request,
    user_id: str,
    session_key: str,
    redis_key_prefix: str,
) -> None:
    window_seconds = _get_rate_limit_window_seconds()
    redis_client = _get_redis_client_from_request(request)
    if redis_client is None:
        _record_session_event(request, user_id, session_key)
        return

    key = _build_rate_limit_key(redis_key_prefix, user_id)

    try:
        count = await redis_client.incr(key)
        if count == 1:
            await redis_client.expire(key, window_seconds)
    except Exception as exc:  # noqa: BLE001 - fail open when limiter is unavailable
        logger.warning(
            "Phone rate-limit record failed, falling back to session: %s",
            str(exc),
        )
        _record_session_event(request, user_id, session_key)


async def assert_phone_mfa_registration_rate_limit_not_exceeded(
    request: Request,
    user_id: str,
    allow_at_limit: bool = False,
) -> None:
    await _assert_rate_limit_not_exceeded(
        request=request,
        user_id=user_id,
        session_key=PHONE_MFA_REGISTRATION_SESSION_KEY,
        redis_key_prefix=PHONE_MFA_REGISTRATION_REDIS_KEY_PREFIX,
        allow_at_limit=allow_at_limit,
    )


async def record_phone_mfa_registration_event(request: Request, user_id: str) -> None:
    await _record_rate_limit_event(
        request=request,
        user_id=user_id,
        session_key=PHONE_MFA_REGISTRATION_SESSION_KEY,
        redis_key_prefix=PHONE_MFA_REGISTRATION_REDIS_KEY_PREFIX,
    )


async def assert_contact_phone_update_rate_limit_not_exceeded(
    request: Request,
    user_id: str,
) -> None:
    await _assert_rate_limit_not_exceeded(
        request=request,
        user_id=user_id,
        session_key=CONTACT_PHONE_UPDATE_SESSION_KEY,
        redis_key_prefix=CONTACT_PHONE_UPDATE_REDIS_KEY_PREFIX,
    )


async def record_contact_phone_update_event(request: Request, user_id: str) -> None:
    await _record_rate_limit_event(
        request=request,
        user_id=user_id,
        session_key=CONTACT_PHONE_UPDATE_SESSION_KEY,
        redis_key_prefix=CONTACT_PHONE_UPDATE_REDIS_KEY_PREFIX,
    )
