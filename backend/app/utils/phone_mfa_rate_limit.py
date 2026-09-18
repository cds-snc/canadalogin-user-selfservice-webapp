import logging
import time
from typing import Any

from fastapi import HTTPException, Request, status

logger = logging.getLogger(__name__)

PHONE_MFA_CHANGE_LIMIT = 3
PHONE_MFA_CHANGE_WINDOW_SECONDS = 24 * 60 * 60
PHONE_MFA_CHANGE_RATE_LIMIT_ERROR_CODE = "phone_mfa_change_rate_limit"
PHONE_MFA_CHANGE_RATE_LIMIT_SESSION_KEY = "phone_mfa_change_events"
PHONE_MFA_CHANGE_RATE_LIMIT_REDIS_KEY_PREFIX = "rate_limit:phone_mfa_change:"


def _build_phone_mfa_change_rate_limit_key(user_id: str) -> str:
    return f"{PHONE_MFA_CHANGE_RATE_LIMIT_REDIS_KEY_PREFIX}{user_id}"


def _prune_expired_session_events(events: list[int], now: int) -> list[int]:
    cutoff = now - PHONE_MFA_CHANGE_WINDOW_SECONDS
    return [event_time for event_time in events if event_time > cutoff]


def _get_session_event_store(request: Request) -> dict[str, list[int]]:
    event_store = request.session.get(PHONE_MFA_CHANGE_RATE_LIMIT_SESSION_KEY, {})
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
    event_store: dict[str, list[int]],
) -> None:
    request.session[PHONE_MFA_CHANGE_RATE_LIMIT_SESSION_KEY] = event_store


def _assert_session_phone_mfa_change_rate_limit_not_exceeded(
    request: Request,
    user_id: str,
) -> None:
    now = int(time.time())
    event_store = _get_session_event_store(request)
    user_events = _prune_expired_session_events(event_store.get(user_id, []), now)
    event_store[user_id] = user_events
    _store_session_event_store(request, event_store)

    if len(user_events) >= PHONE_MFA_CHANGE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=PHONE_MFA_CHANGE_RATE_LIMIT_ERROR_CODE,
        )


def _record_session_phone_mfa_change_event(request: Request, user_id: str) -> None:
    now = int(time.time())
    event_store = _get_session_event_store(request)
    user_events = _prune_expired_session_events(event_store.get(user_id, []), now)
    user_events.append(now)
    event_store[user_id] = user_events
    _store_session_event_store(request, event_store)


def _get_redis_client_from_request(request: Request) -> Any:
    app = getattr(request, "app", None)
    state = getattr(app, "state", None)
    return getattr(state, "redis_client", None)


async def assert_phone_mfa_change_rate_limit_not_exceeded(
    request: Request,
    user_id: str,
) -> None:
    redis_client = _get_redis_client_from_request(request)
    if redis_client is None:
        _assert_session_phone_mfa_change_rate_limit_not_exceeded(request, user_id)
        return

    key = _build_phone_mfa_change_rate_limit_key(user_id)

    try:
        raw_count = await redis_client.get(key)
        if raw_count is None:
            return

        if isinstance(raw_count, bytes):
            count = int(raw_count.decode("utf-8"))
        else:
            count = int(raw_count)

        if count >= PHONE_MFA_CHANGE_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=PHONE_MFA_CHANGE_RATE_LIMIT_ERROR_CODE,
            )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001 - fail open when limiter is unavailable
        logger.warning(
            "Phone MFA rate-limit check failed, falling back to session: %s",
            str(exc),
        )
        _assert_session_phone_mfa_change_rate_limit_not_exceeded(request, user_id)


async def record_phone_mfa_change_event(request: Request, user_id: str) -> None:
    redis_client = _get_redis_client_from_request(request)
    if redis_client is None:
        _record_session_phone_mfa_change_event(request, user_id)
        return

    key = _build_phone_mfa_change_rate_limit_key(user_id)

    try:
        count = await redis_client.incr(key)
        if count == 1:
            await redis_client.expire(key, PHONE_MFA_CHANGE_WINDOW_SECONDS)
    except Exception as exc:  # noqa: BLE001 - fail open when limiter is unavailable
        logger.warning(
            "Phone MFA rate-limit record failed, falling back to session: %s",
            str(exc),
        )
        _record_session_phone_mfa_change_event(request, user_id)
