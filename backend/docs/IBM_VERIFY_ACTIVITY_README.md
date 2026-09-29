# IBM Verify user activity

## Verified API contract

This integration uses only the following IBM Security Verify APIs:

- `POST {tenant}/oauth2/token` with `grant_type=client_credentials`. The API client must have the report/session entitlements required by the endpoints below.
- `GET {tenant}/v1.0/events?event_type="sso"&size=...`. The Events API documents event categories, but its OpenAPI schema intentionally declares an event as an untyped object. Pagination uses the returned `search_after.id` and `search_after.time` as `after_id` and `after_time` on the next request. The API documents a maximum of 10,000 events per response window.
- `GET {tenant}/v1.0/auth/sessions/{userId}`. The documented response contains `sessions[]` with `sessionId`, `lastAccessTime`, and `expiryTime`.

References:

- https://docs.verify.ibm.com/verify/reference/getallevents.md
- https://docs.verify.ibm.com/verify/reference/getsessions.md
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

- The latest configured SSO event determines `lastLogin` for a user/application pair.
- The latest configured SLO event determines `lastLogout` for a user/application pair.
- Correlation uses user ID and application ID. `session_id` is enriched from the event's configured usersessionid path when present.
- A successful SSO event with no later SLO event produces `LAST_KNOWN_ACTIVE`, not `ACTIVE`. This is the RP's last known event state, not proof that the RP's own browser session is still active.
- A logout at or after the latest login produces `LOGGED_OUT`.
- A matched Verify session whose `expiryTime` is in the past produces `EXPIRED`.
- Missing session information produces `UNKNOWN`; an old SSO event does not imply expiry.
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
```
