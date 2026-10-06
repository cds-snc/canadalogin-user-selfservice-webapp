from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest

from app.verify_activity.client import IBMVerifyActivityClient
from app.verify_activity.service import (
    _parse_time,
    calculate_activity,
    get_user_activity,
)


def settings(sso="sso.success", slo="slo.success"):
    return SimpleNamespace(
        events_api_endpoint="https://tenant.example/v1.0/events",
        ibm_verify_config=SimpleNamespace(
            IBM_VERIFY_TENANT_URL="https://tenant.example",
            IBM_VERIFY_CLIENT_ID=None,
            IBM_VERIFY_CLIENT_SECRET=None,
            IBM_VERIFY_PROFILE_MANAGEMENT_API_CLIENT_ID="client",
            IBM_VERIFY_PROFILE_MANAGEMENT_API_SECRET="secret",
            IBM_VERIFY_ACTIVITY_API_CLIENT_ID="events-client",
            IBM_VERIFY_ACTIVITY_API_SECRET="events-secret",
            IBM_VERIFY_ACTIVITY_SSO_EVENT_TYPES=sso,
            IBM_VERIFY_ACTIVITY_SLO_EVENT_TYPES=slo,
            IBM_VERIFY_ACTIVITY_SSO_ACTIONS="issued",
            IBM_VERIFY_ACTIVITY_SLO_ACTIONS="sso_logout",
            IBM_VERIFY_ACTIVITY_LOOKBACK_DAYS=30,
        ),
    )


def event(event_type, application_id, time, user_id="user-1"):
    return {
        "event_type": event_type,
        "time": time,
        "data": {
            "userid": user_id,
            "applicationid": application_id,
            "client_id": f"client-{application_id}",
            "result": "success",
            "action": "issued",
        },
    }


def test_calculates_latest_login_and_logout_per_application():
    result = calculate_activity(
        "user-1",
        [
            event("sso.success", "salesforce", "2026-01-01T10:00:00Z"),
            {
                **event("slo.success", "salesforce", "2026-01-01T11:00:00Z"),
                "data": {
                    **event("slo.success", "salesforce", "2026-01-01T11:00:00Z")[
                        "data"
                    ],
                    "action": "sso_logout",
                },
            },
            event("sso.success", "salesforce", "2026-01-02T10:00:00Z"),
            event("sso.success", "servicenow", "2026-01-02T10:00:00Z"),
            event("sso.success", "ignored", "2026-01-02T10:00:00Z", user_id="other"),
        ],
        settings(),
    )

    assert [item.application_id for item in result] == ["salesforce", "servicenow"]
    assert result[0].last_login.isoformat() == "2026-01-02T10:00:00+00:00"
    assert result[0].last_logout.isoformat() == "2026-01-01T11:00:00+00:00"
    assert result[1].last_logout is None


def test_ignores_unsuccessful_and_malformed_events():
    failure = event("slo.success", "app", "2026-01-02T10:00:00Z")
    failure["data"]["result"] = "failure"
    result = calculate_activity(
        "user-1",
        [
            event("sso.success", "app", "2026-01-01T10:00:00Z"),
            failure,
            event("sso.success", "bad", "not-a-date"),
        ],
        settings(),
    )

    assert len(result) == 1
    assert result[0].last_logout is None


@pytest.mark.parametrize("value", [1e300, float("nan"), True])
def test_invalid_numeric_timestamps_are_ignored(value):
    assert _parse_time(value) is None


@pytest.mark.asyncio
async def test_get_user_activity_does_not_fetch_sessions():
    client = Mock(settings=settings())
    client.get_events = AsyncMock(
        return_value=[event("sso.success", "app", "2026-01-01T10:00:00Z")]
    )
    result = await get_user_activity(client, "user-1")
    assert len(result) == 1
    client.get_events.assert_awaited_once_with(
        event_type='"slo.success","sso.success"',
        user_id="user-1",
        user_id_field="data.userid",
    )


@pytest.mark.asyncio
async def test_events_client_uses_documented_after_cursor():
    client = AsyncMock()
    token_response = Mock(json=Mock(return_value={"access_token": "test-token"}))
    client.post = AsyncMock(return_value=token_response)
    responses = [
        Mock(
            json=Mock(
                return_value={
                    "response": {
                        "events": {
                            "events": [{"id": "one"}],
                            "search_after": {"id": "one", "time": "10"},
                        }
                    }
                }
            )
        ),
        Mock(
            json=Mock(
                return_value={
                    "response": {
                        "events": {
                            "events": [{"id": "two"}],
                            "search_after": {"id": "two", "time": "20"},
                        }
                    }
                }
            )
        ),
        Mock(
            json=Mock(
                return_value={
                    "response": {"events": {"events": [], "search_after": {}}}
                }
            )
        ),
    ]
    client.get = AsyncMock(side_effect=responses)
    activity_client = IBMVerifyActivityClient(client, settings())

    result = await activity_client.get_events(
        event_type='"sso"', user_id="user-1", user_id_field="data.userid", size=2
    )

    assert result == [{"id": "one"}, {"id": "two"}]
    client.post.assert_awaited_once()
    assert client.post.await_args.kwargs["data"]["client_id"] == "events-client"
    assert client.post.await_args.kwargs["data"]["client_secret"] == "events-secret"
    assert client.get.await_args_list[0].kwargs["params"]["filter_key"] == "data.userid"
    assert client.get.await_args_list[0].kwargs["params"]["filter_value"] == '"user-1"'
    assert client.get.await_args_list[1].kwargs["params"]["after_id"] == "one"
    assert client.get.await_args_list[1].kwargs["params"]["after_time"] == "10"


@pytest.mark.asyncio
async def test_events_client_uses_dedicated_activity_credentials():
    client = AsyncMock()
    client.post.return_value = Mock(
        json=Mock(return_value={"access_token": "activity-token"})
    )
    client.get.return_value = Mock(
        json=Mock(return_value={"response": {"events": {"events": []}}})
    )
    config = settings()
    config.ibm_verify_config.IBM_VERIFY_TENANT_URL += "/"
    config.ibm_verify_config.IBM_VERIFY_ACTIVITY_API_CLIENT_ID = "events-client"
    config.ibm_verify_config.IBM_VERIFY_ACTIVITY_API_SECRET = "events-secret"

    await IBMVerifyActivityClient(client, config).get_events(
        event_type='"sso"', user_id="user-1", user_id_field="data.userid"
    )

    assert client.post.await_args.args[0] == "https://tenant.example/oauth2/token"
    assert client.post.await_args.kwargs["data"]["client_id"] == "events-client"
    assert client.post.await_args.kwargs["data"]["client_secret"] == "events-secret"
    assert (
        client.get.await_args.kwargs["headers"]["Authorization"]
        == "Bearer activity-token"
    )


@pytest.mark.parametrize(
    "client_id,client_secret",
    [(None, None), (None, "events-secret"), ("events-client", None)],
)
def test_events_client_rejects_missing_activity_credentials(client_id, client_secret):
    config = settings()
    config.ibm_verify_config.IBM_VERIFY_ACTIVITY_API_CLIENT_ID = client_id
    config.ibm_verify_config.IBM_VERIFY_ACTIVITY_API_SECRET = client_secret

    with pytest.raises(ValueError, match="Both IBM Verify activity credentials"):
        IBMVerifyActivityClient(AsyncMock(), config)
