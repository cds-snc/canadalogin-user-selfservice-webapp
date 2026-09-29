# IBM Verify user activity

## Verified API contract

This integration uses only the following IBM Security Verify APIs:
- `GET {tenant}/v1.0/auth/sessions/{userId}`. The documented response contains `sessions[]` with `sessionId`, `lastAccessTime`, and `expiryTime`.

References:
- https://docs.verify.ibm.com/verify/reference/post_oauth2-token.md

The Events API does not publish a typed SSO/SLO payload schema in its API reference. This service therefore does not invent IBM field names. Configure the paths observed in your tenant's event payloads using `IBM_VERIFY_ACTIVITY_EVENT_FIELD_MAP`.

## Configuration

Add these variables to the backend environment:

```text
IBM_VERIFY_ACTIVITY_SSO_EVENT_TYPES=...
IBM_VERIFY_ACTIVITY_SLO_EVENT_TYPES=slo
IBM_VERIFY_ACTIVITY_LOOKBACK_DAYS=30
IBM_VERIFY_ACTIVITY_EVENT_FIELD_MAP={"event_type":"...","user_id":"...","username":"...","application_id":"...","application_name":"...","client_id":"...","protocol":"...","session_id":"...","timestamp":"..."}
```

The activity client reuses `IBM_VERIFY_PROFILE_MANAGEMENT_API_CLIENT_ID` and `IBM_VERIFY_PROFILE_MANAGEMENT_API_SECRET`. It searches the last 30 days by default; increase `IBM_VERIFY_ACTIVITY_LOOKBACK_DAYS` when older login history is required. In the verified tenant payload, successful RP login is `event_type=sso`, `data.action=issued`, `data.result=success`; successful RP logout is `event_type=slo`, `data.action=sso_logout`, `data.result=success`. The event-type and action lists are comma-separated exact values from the tenant payload. The field map values are dot-separated paths into one event object. `user_id`, `application_id`, and `timestamp` are required for an event to contribute to an RP record; the remaining values are optional.

The API client never logs client secrets or access tokens. The route is:

```text
GET /v1/users/activity
```

It uses the authenticated user's profile to obtain the Verify user ID and returns activity grouped by application/RP.

## Semantics and limitations
- IBM's session endpoint is user-scoped and does not state which RP owns a session. RP-level expiry can therefore only be enriched when the event supplies a matching session ID.

The response shape is:

```json
{
  "user_id": "...",
  "username": "john@example.com",
  "activities": [
    {
      "user_id": "...",
      "username": "john@example.com",
      "rp": {
        "applicationId": "...",
        "applicationName": "Salesforce",
        "clientId": "...",
        "protocol": "OIDC"
      },
      "last_login": "...",
      "last_logout": "...",
      "session_id": "...",
      "status": "LAST_KNOWN_ACTIVE",
      "session_expires": "..."
    }
  ]
}
# IBM Verify connected-service login and logout times

The connected-services endpoint (`GET /v1/users/connected-services`) returns the latest
successful login and logout event timestamps for each of the authenticated user's
connected applications:

```json
{
  "services": [
    {
      "clientId": "...",
      "name": "Salesforce",
      "lastLogin": "2026-01-01T10:00:00Z",
      "lastLogout": "2026-01-02T11:00:00Z"
    }
  ]
}
```

Either timestamp can be `null` when no matching event was found. These are event
times, not proof of an active RP session. If activity lookup fails, the existing
connected-services list still returns with null timestamps.

The activity client uses `POST {tenant}/oauth2/token` (client credentials) and
`GET {tenant}/v1.0/events?event_type="sso","slo"&size=...`. The API client must
have the report entitlements needed for Events API access. Pagination uses the
returned `search_after.id` and `search_after.time` as `after_id` and `after_time`.

References:

- https://docs.verify.ibm.com/verify/reference/getallevents.md
- https://docs.verify.ibm.com/verify/reference/post_oauth2-token.md

IBM's Events API does not publish a typed SSO/SLO event payload. Configure the
paths observed in your tenant's payloads using these backend variables:

```text
IBM_VERIFY_ACTIVITY_SSO_EVENT_TYPES=sso
IBM_VERIFY_ACTIVITY_SLO_EVENT_TYPES=slo
IBM_VERIFY_ACTIVITY_SSO_ACTIONS=issued
IBM_VERIFY_ACTIVITY_SLO_ACTIONS=sso_logout
IBM_VERIFY_ACTIVITY_LOOKBACK_DAYS=30
IBM_VERIFY_ACTIVITY_EVENT_FIELD_MAP={"event_type":"event_type","user_id":"data.userid","application_id":"data.applicationid","client_id":"data.client_id","result":"data.result","action":"data.action","timestamp":"time"}
```

The client reuses `IBM_VERIFY_PROFILE_MANAGEMENT_API_CLIENT_ID` and
`IBM_VERIFY_PROFILE_MANAGEMENT_API_SECRET` without logging secrets or tokens.
Event types and actions are comma-separated exact values; field-map values are
dot-separated paths. `user_id`, `application_id`, and `timestamp` must resolve,
and `result` must equal `success`. An event contributes only to the authenticated
user's matching application; a `client_id` can match the connected service when
the event application ID differs from the listed application's ID. The most
recent event of each type supplies that application's timestamp. The default
lookback is 30 days; increase it for older history.
```
