import logging
import time
from typing import Any

from app.config import get_configuration
from fastapi import HTTPException, Request, status

logger = logging.getLogger(__name__)

PHONE_RATE_LIMIT = 3
PHONE_RATE_LIMIT_WINDOW_SECONDS_PROD = 24 * 60 * 60
PHONE_RATE_LIMIT_WINDOW_SECONDS_NON_PROD = 5 * 60
PHONE_RATE_LIMIT_ERROR_CODE = "phone_mfa_change_rate_limit"

PHONE_MFA_REGISTRATION_SESSION_KEY = "phone_mfa_registration_events"
PHONE_MFA_REGISTRATION_REDIS_KEY_PREFIX = "rate_limit:phone_mfa_registration:"

CONTACT_PHONE_UPDATE_SESSION_KEY = "contact_phone_update_events"
CONTACT_PHONE_UPDATE_REDIS_KEY_PREFIX = "rate_limit:contact_phone_update:"


def _get_rate_limit_window_seconds() -> int:
    environment = get_configuration().ENVIRONMENT.strip().lower()

    if environment in {"staging", "prod"}:
        return PHONE_RATE_LIMIT_WINDOW_SECONDS_PROD

    if environment in {"local", "dev", "test"}:
        return PHONE_RATE_LIMIT_WINDOW_SECONDS_NON_PROD

    # Fail closed to production-level limits for unknown environments.
    return PHONE_RATE_LIMIT_WINDOW_SECONDS_PROD


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
) -> None:
    now = int(time.time())
    window_seconds = _get_rate_limit_window_seconds()
    event_store = _get_session_event_store(request, session_key)
    user_events = _prune_expired_session_events(
        event_store.get(user_id, []), now, window_seconds
    )
    event_store[user_id] = user_events
    _store_session_event_store(request, session_key, event_store)

    if len(user_events) >= PHONE_RATE_LIMIT:
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
) -> None:
    redis_client = _get_redis_client_from_request(request)
    if redis_client is None:
        _assert_session_rate_limit_not_exceeded(request, user_id, session_key)
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

        if count >= PHONE_RATE_LIMIT:
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
        _assert_session_rate_limit_not_exceeded(request, user_id, session_key)


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
) -> None:
    await _assert_rate_limit_not_exceeded(
        request=request,
        user_id=user_id,
        session_key=PHONE_MFA_REGISTRATION_SESSION_KEY,
        redis_key_prefix=PHONE_MFA_REGISTRATION_REDIS_KEY_PREFIX,
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
