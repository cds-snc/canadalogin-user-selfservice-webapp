# IBM Verify connected-service login and logout times

The connected-services endpoint (`GET /v1/users/connected-services`) uses IBM
Verify Events API SSO/SLO events to find the latest successful login and logout
timestamps for the authenticated user's connected applications. This feature
does not query or capture IBM Verify RP sessions.

The response retains both timestamps for future use:

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
times, not proof of an active RP session. Logout is returned as `lastLogout` by
the API but is not currently displayed in the connected-services page. If
activity lookup fails, the connected-services list still returns with null
timestamps.

The activity client uses `POST {tenant}/oauth2/token` (client credentials) and
`GET {tenant}/v1.0/events?event_type="sso","slo"&size=...`. The dedicated API
client needs the `readReports` entitlement for Events API access (not
`manageReports`). Pagination uses the
returned `search_after.id` and `search_after.time` as `after_id` and `after_time`.

References:

- https://docs.verify.ibm.com/verify/reference/getallevents.md
- https://docs.verify.ibm.com/verify/reference/post_oauth2-token.md

IBM's Events API does not publish a typed SSO/SLO event payload. The payload
paths used by the activity service are declared in `EVENT_FIELD_MAP` in
`app/verify_activity/service.py`. Update that mapping in code if the tenant's
event payload shape changes. Event categories, actions, and the lookback period
remain configurable with these backend variables:

```text
IBM_VERIFY_ACTIVITY_SSO_EVENT_TYPES=sso
IBM_VERIFY_ACTIVITY_SLO_EVENT_TYPES=slo
IBM_VERIFY_ACTIVITY_SSO_ACTIONS=issued
IBM_VERIFY_ACTIVITY_SLO_ACTIONS=sso_logout
IBM_VERIFY_ACTIVITY_LOOKBACK_DAYS=30
```

Configure both `IBM_VERIFY_ACTIVITY_API_ID` and
`IBM_VERIFY_ACTIVITY_API_SECRET` for the dedicated IBM Verify API client.
Activity lookup does not fall back to profile-management credentials. If either
activity credential is missing, activity lookup fails and connected services
still returns without timestamps. Neither secrets nor tokens are logged.
Event types and actions are comma-separated exact values. The client sends the
mapped user field and authenticated user ID as the Events API filter, so it does
not download tenant-wide events.
`user_id`, `application_id`, and `timestamp` must resolve, and `result` must
equal `success`. The most recent event of each type supplies that application's
timestamp. The default lookback is 30 days; increase it for older history.
