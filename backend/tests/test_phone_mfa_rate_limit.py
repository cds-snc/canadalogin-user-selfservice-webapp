from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

import app.utils.phone_mfa_rate_limit as phone_mfa_rate_limit_module
from app.utils.phone_mfa_rate_limit import (
    CONTACT_PHONE_UPDATE_REDIS_KEY_PREFIX,
    CONTACT_PHONE_UPDATE_SESSION_KEY,
    PHONE_RATE_LIMIT,
    PHONE_RATE_LIMIT_WINDOW_SECONDS_NON_PROD,
    PHONE_RATE_LIMIT_WINDOW_SECONDS_PROD,
    PHONE_MFA_REGISTRATION_REDIS_KEY_PREFIX,
    PHONE_MFA_REGISTRATION_SESSION_KEY,
    assert_contact_phone_update_rate_limit_not_exceeded,
    assert_phone_mfa_registration_rate_limit_not_exceeded,
    record_contact_phone_update_event,
    record_phone_mfa_registration_event,
)


def _build_request_with_session(redis_client=None):
    app_state = SimpleNamespace(redis_client=redis_client)
    app = SimpleNamespace(state=app_state)
    return SimpleNamespace(session={}, app=app)


@pytest.mark.asyncio
async def test_phone_mfa_and_contact_phone_limits_are_independent_with_session_store():
    request = _build_request_with_session(redis_client=None)
    user_id = "user-123"

    for _ in range(PHONE_RATE_LIMIT):
        await assert_phone_mfa_registration_rate_limit_not_exceeded(request, user_id)
        await record_phone_mfa_registration_event(request, user_id)

    await assert_contact_phone_update_rate_limit_not_exceeded(request, user_id)

    for _ in range(PHONE_RATE_LIMIT):
        await assert_contact_phone_update_rate_limit_not_exceeded(request, user_id)
        await record_contact_phone_update_event(request, user_id)

    with pytest.raises(HTTPException) as contact_limit_exc:
        await assert_contact_phone_update_rate_limit_not_exceeded(request, user_id)
    assert contact_limit_exc.value.status_code == 429
    assert contact_limit_exc.value.detail == "phone_mfa_change_rate_limit"

    with pytest.raises(HTTPException) as mfa_limit_exc:
        await assert_phone_mfa_registration_rate_limit_not_exceeded(request, user_id)
    assert mfa_limit_exc.value.status_code == 429
    assert mfa_limit_exc.value.detail == "phone_mfa_change_rate_limit"

    assert (
        len(request.session[PHONE_MFA_REGISTRATION_SESSION_KEY][user_id])
        == PHONE_RATE_LIMIT
    )
    assert (
        len(request.session[CONTACT_PHONE_UPDATE_SESSION_KEY][user_id])
        == PHONE_RATE_LIMIT
    )


@pytest.mark.asyncio
async def test_phone_mfa_verification_allows_limit_but_rejects_above_limit(
    monkeypatch,
):
    request = _build_request_with_session(redis_client=None)
    user_id = "user-123"
    monkeypatch.setattr(phone_mfa_rate_limit_module.time, "time", lambda: 1000)
    request.session[PHONE_MFA_REGISTRATION_SESSION_KEY] = {
        user_id: [1000] * PHONE_RATE_LIMIT
    }

    await assert_phone_mfa_registration_rate_limit_not_exceeded(
        request,
        user_id,
        allow_at_limit=True,
    )

    request.session[PHONE_MFA_REGISTRATION_SESSION_KEY][user_id].append(1000)

    with pytest.raises(HTTPException) as exc_info:
        await assert_phone_mfa_registration_rate_limit_not_exceeded(
            request,
            user_id,
            allow_at_limit=True,
        )

    assert exc_info.value.status_code == 429


@pytest.mark.asyncio
async def test_phone_mfa_and_contact_phone_events_use_different_redis_keys():
    redis_client = AsyncMock()
    redis_client.incr.side_effect = [1, 1]

    request = _build_request_with_session(redis_client=redis_client)
    user_id = "user-123"

    await record_phone_mfa_registration_event(request, user_id)
    await record_contact_phone_update_event(request, user_id)

    increment_keys = [call.args[0] for call in redis_client.incr.await_args_list]
    assert increment_keys == [
        f"{PHONE_MFA_REGISTRATION_REDIS_KEY_PREFIX}{user_id}",
        f"{CONTACT_PHONE_UPDATE_REDIS_KEY_PREFIX}{user_id}",
    ]

    expire_keys = [call.args[0] for call in redis_client.expire.await_args_list]
    assert expire_keys == increment_keys


@pytest.mark.asyncio
@pytest.mark.parametrize("environment", ["local", "dev", "test"])
async def test_phone_mfa_rate_limit_window_is_15_minutes_in_non_prod_environments(
    monkeypatch,
    environment,
):
    monkeypatch.setattr(
        phone_mfa_rate_limit_module,
        "get_configuration",
        lambda: SimpleNamespace(ENVIRONMENT=environment),
    )

    redis_client = AsyncMock()
    redis_client.incr.return_value = 1
    request = _build_request_with_session(redis_client=redis_client)
    user_id = "user-123"

    await record_phone_mfa_registration_event(request, user_id)

    redis_client.expire.assert_awaited_once_with(
        f"{PHONE_MFA_REGISTRATION_REDIS_KEY_PREFIX}{user_id}",
        PHONE_RATE_LIMIT_WINDOW_SECONDS_NON_PROD,
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("environment", ["staging", "prod"])
async def test_contact_phone_rate_limit_window_is_24_hours_in_prod_environments(
    monkeypatch,
    environment,
):
    monkeypatch.setattr(
        phone_mfa_rate_limit_module,
        "get_configuration",
        lambda: SimpleNamespace(ENVIRONMENT=environment),
    )

    redis_client = AsyncMock()
    redis_client.incr.return_value = 1
    request = _build_request_with_session(redis_client=redis_client)
    user_id = "user-123"

    await record_contact_phone_update_event(request, user_id)

    redis_client.expire.assert_awaited_once_with(
        f"{CONTACT_PHONE_UPDATE_REDIS_KEY_PREFIX}{user_id}",
        PHONE_RATE_LIMIT_WINDOW_SECONDS_PROD,
    )
