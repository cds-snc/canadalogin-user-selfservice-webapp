from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest

from app.verify_activity.client import IBMVerifyActivityClient
from app.verify_activity.schemas import ActivityStatus
from app.verify_activity.service import calculate_activity


FIELD_MAP = {
    "event_type": "type",
    "user_id": "data.userId",
    "username": "data.username",
    "application_id": "data.applicationId",
    "application_name": "data.applicationName",
    "client_id": "data.clientId",
    "protocol": "data.protocol",
    "session_id": "data.usersessionid",
    "result": "data.result",
    "action": "data.action",
    "timestamp": "time",
}


def settings(sso="sso.success", slo="slo.success"):
    return SimpleNamespace(
        ibm_verify_config=SimpleNamespace(
            IBM_VERIFY_TENANT_URL="https://tenant.example",
            IBM_VERIFY_CLIENT_ID=None,
            IBM_VERIFY_CLIENT_SECRET=None,
            IBM_VERIFY_PROFILE_MANAGEMENT_API_CLIENT_ID="client",
            IBM_VERIFY_PROFILE_MANAGEMENT_API_SECRET="secret",
            IBM_VERIFY_ACTIVITY_EVENT_FIELD_MAP=__import__("json").dumps(FIELD_MAP),
            IBM_VERIFY_ACTIVITY_SSO_EVENT_TYPES=sso,
            IBM_VERIFY_ACTIVITY_SLO_EVENT_TYPES=slo,
            IBM_VERIFY_ACTIVITY_SSO_ACTIONS="issued",
            IBM_VERIFY_ACTIVITY_SLO_ACTIONS="sso_logout",
            IBM_VERIFY_ACTIVITY_LOOKBACK_DAYS=30,
        )
    )


def event(event_type, application_id, time, session_id="session-1", name="App"):
    return {
        "type": event_type,
        "time": time,
        "data": {
            "userId": "user-1",
            "username": "john@example.com",
            "applicationId": application_id,
            "applicationName": name,
            "clientId": f"client-{application_id}",
            "protocol": "OIDC",
            "usersessionid": session_id,
            "result": "success",
            "action": "issued",
        },
    }


def test_calculates_multiple_rps_and_logout_status():
    result = calculate_activity(
        "user-1",
        "john@example.com",
        [
            event("sso.success", "salesforce", "2026-01-01T10:00:00Z", "session-salesforce"),
            {
                **event("slo.success", "salesforce", "2026-01-01T11:00:00Z", "session-salesforce"),
                "data": {
                    **event(
                        "slo.success",
                        "salesforce",
                        "2026-01-01T11:00:00Z",
                        "session-salesforce",
                    )["data"],
                    "action": "sso_logout",
                },
            },
            event("sso.success", "servicenow", "2026-01-02T10:00:00Z", "session-servicenow", "ServiceNow"),
        ],
        [{"sessionId": "session-servicenow", "expiryTime": "2099-01-01T00:00:00Z"}],
        settings(),
    )

    assert [item.rp["applicationId"] for item in result] == ["salesforce", "servicenow"]
    assert result[0].status == ActivityStatus.LOGGED_OUT
    assert result[1].status == ActivityStatus.LAST_KNOWN_ACTIVE


def test_expired_and_unknown_statuses_are_conservative():
    result = calculate_activity(
        "user-1",
        None,
        [event("sso.success", "expired", "2026-01-01T10:00:00Z", "expired-session"), event("sso.success", "unknown", "2026-01-01T10:00:00Z", "missing-session")],
        [{"sessionId": "expired-session", "expiryTime": "2020-01-01T00:00:00Z"}],
        settings(slo="slo.success"),
    )

    assert result[0].status == ActivityStatus.EXPIRED
    assert result[1].status == ActivityStatus.LAST_KNOWN_ACTIVE


@pytest.mark.asyncio
async def test_events_client_uses_documented_after_cursor():
    client = AsyncMock()
    token_response = Mock(json=Mock(return_value={"access_token": "test-token"}))
    client.post = AsyncMock(return_value=token_response)
    responses = [
        Mock(json=Mock(return_value={"response": {"events": {"events": [{"id": "one"}], "search_after": {"id": "one", "time": "10"}}}})),
        Mock(json=Mock(return_value={"response": {"events": {"events": [{"id": "two"}], "search_after": {"id": "two", "time": "20"}}}})),
        Mock(json=Mock(return_value={"response": {"events": {"events": [], "search_after": {}}}})),
    ]
    client.get = AsyncMock(side_effect=responses)
    activity_client = IBMVerifyActivityClient(client, settings())

    result = await activity_client.get_events(event_type='"sso"', size=2)

    assert result == [{"id": "one"}, {"id": "two"}]
    assert client.get.await_args_list[1].kwargs["params"]["after_id"] == "one"
    assert client.get.await_args_list[1].kwargs["params"]["after_time"] == "10"
