from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException, Request

from app.identity_verification.dependencies import require_idv_feature_access
from app.users.schemas import IBMVerifyUserProfileSchema


def build_request(environment: str, group_ids: set[str]) -> Request:
    app = SimpleNamespace(
        state=SimpleNamespace(
            config=SimpleNamespace(
                ENVIRONMENT=environment,
                idv_feature_access_group_ids=group_ids,
            ),
            request_client=object(),
        )
    )
    return Request({"type": "http", "app": app})


@pytest.mark.asyncio
@pytest.mark.parametrize("environment", ["local", "dev", "test", "staging", "prod"])
async def test_idv_access_forbids_users_outside_configured_groups(
    environment, monkeypatch
):
    profile_lookup = AsyncMock(
        return_value=IBMVerifyUserProfileSchema.model_construct(groups=[])
    )
    monkeypatch.setattr(
        "app.identity_verification.dependencies.dispatch_get_my_profile_from_ibm",
        profile_lookup,
    )

    with pytest.raises(HTTPException) as error:
        await require_idv_feature_access(
            build_request(environment, {"8160000157"}),
            user_access_token="user-token",
        )

    assert error.value.status_code == 403
    profile_lookup.assert_awaited_once()


@pytest.mark.asyncio
@pytest.mark.parametrize("environment", ["local", "dev", "test", "staging", "prod"])
async def test_idv_access_allows_configured_group_member(environment, monkeypatch):
    profile_lookup = AsyncMock(
        return_value=IBMVerifyUserProfileSchema.model_construct(
            groups=[SimpleNamespace(id="second-group")]
        )
    )
    monkeypatch.setattr(
        "app.identity_verification.dependencies.dispatch_get_my_profile_from_ibm",
        profile_lookup,
    )

    await require_idv_feature_access(
        build_request(environment, {"8160000157", "second-group"}),
        user_access_token="user-token",
    )

    profile_lookup.assert_awaited_once()
