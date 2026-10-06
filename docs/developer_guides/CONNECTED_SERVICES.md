# Connected Services

The connected-services endpoint is `GET /v1/users/connected-services`. It requires the existing authenticated session and returns only:

```json
{
  "services": [
    {
      "clientId": "client-id",
      "name": "Example Service",
      "lastLogin": "2026-01-01T10:00:00Z",
      "lastLogout": "2026-01-02T11:00:00Z"
    }
  ]
}
```

## IBM Verify integration

The backend uses these server-side IBM Verify APIs:

- `GET /v2.0/Me` with the authenticated user's access token to read the user's custom attributes and obtain the configured `pairwiseIdPerClient` entries.
- `GET /v1.0/user/applications` with the authenticated user's server-side access token to retrieve that user's entitled applications. IBM's `searchuserapplication` reference documents this as an authenticated-user API and identifies `id`, `name`, `links`, and `status` as application fields.

The authenticated user's access token is used for both IBM Verify calls. Since `GET /v2.0/Me` is already scoped to the authenticated user, every `clientId` listed under `pairwiseIdPerClient` belongs to them; the backend collects all of these `clientId` values (regardless of their `pai`) and matches each to an application `id`. The raw custom attribute, user UUID, client secret, and administrative token are never returned to the browser.

The existing server-side client credentials remain available for administrative application lookups used by the legacy RP-info route. Connected Services uses the authenticated user token for the user-entitlements lookup. No new browser credentials or environment variables are required.

## Login and logout activity

Login and logout timestamps are derived from the authenticated user's successful
IBM Verify SSO/SLO events; the implementation does not query or capture RP
sessions. Either timestamp is `null` when no corresponding event is available.
The API retains both timestamps, but the page currently displays only the last
login. These event timestamps do not establish whether an RP session is active.

The existing `Sign out everywhere` button remains presentational; it does not
revoke sessions.