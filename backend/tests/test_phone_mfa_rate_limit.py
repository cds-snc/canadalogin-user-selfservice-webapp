from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from app.utils.phone_mfa_rate_limit import (
    CONTACT_PHONE_UPDATE_REDIS_KEY_PREFIX,
    CONTACT_PHONE_UPDATE_SESSION_KEY,
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

    for _ in range(3):
        await assert_phone_mfa_registration_rate_limit_not_exceeded(request, user_id)
        await record_phone_mfa_registration_event(request, user_id)

    await assert_contact_phone_update_rate_limit_not_exceeded(request, user_id)

    for _ in range(3):
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

    assert len(request.session[PHONE_MFA_REGISTRATION_SESSION_KEY][user_id]) == 3
    assert len(request.session[CONTACT_PHONE_UPDATE_SESSION_KEY][user_id]) == 3


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
