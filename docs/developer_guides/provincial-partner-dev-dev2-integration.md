# Provincial Partner Identity Linking (DEV broker + DEV2 IdP)

## Purpose

This document captures the implementation and testing work completed for provincial partner sign-in where:

- DEV tenant is the broker and application-facing OIDC tenant.
- DEV2 tenant is the external OIDC identity provider used for provincial partner authentication.

It also documents current limitations and next steps.

Latest update (current POC state):

- Reliable DEV2 routing is currently achieved by rewriting login through `/auth/...` before the OIDC authorize target is executed.
- The implementation now uses one backend config value for provincial routing: `IBM_VERIFY_PROVINCIAL_PARTNERS_IDENTITY_SOURCE_ID`.
- `IBM_VERIFY_PROVINCIAL_PARTNERS_IDENTITY_SOURCE_FRIENDLY_NAME` was removed from active code to reduce duplicate configuration.

## Scope covered in this document

1. DEV2 OIDC application setup.
2. DEV identity provider setup (pointing to DEV2).
3. How DEV app and DEV identity provider were linked.
4. How frontend and backend were integrated.
5. Current issue: reliable routing to DEV2 when Cloud Directory is also enabled.

## High-level architecture

```mermaid
flowchart LR
    U[User on ProvincialVerificationPage] --> FE[Frontend Provincial Partner Card]
  FE --> BE[/GET /v1/auth/login?partner=bc or ab/]

    BE --> DEV_AUTH[DEV Verify authorize and hosted login]
    DEV_AUTH -->|identity_source_id hint| DEV_IDP[DEV Identity Provider: Provincial Partner POC DEV2]

    DEV_IDP --> DEV2_AUTH[DEV2 OIDC Application Authentication]
    DEV2_AUTH --> DEV_CB[DEV broker callback]
    DEV_CB --> BE_CB[/GET /v1/auth/callback/]
    BE_CB --> FE_CONNECTED[Frontend /online/provincial/link/{partnerId}/success]

    DEV_AUTH -. if Cloud Directory also enabled and policy precedence wins .-> DEV_CD[DEV Cloud Directory authentication]
```

## Completed setup

## 1) DEV2 OIDC application setup

In DEV2 tenant, an OIDC app was configured for brokered login from DEV.

Configuration highlights:

- OIDC client created in DEV2.
- Redirect URI allowlist updated to include the DEV broker redirect URI.
- Entitlements configured for test users (or temporary broad access during testing).

Observed errors and resolutions:

- `CSIAQ0167E` (redirect URI mismatch): fixed by adding exact DEV redirect URI to DEV2 app.
- `CSIAQ0279E` (user not entitled): fixed by assigning access/entitlement in DEV2 app.

## 2) DEV identity provider setup

In DEV tenant, an identity provider named similar to `Provincial Partner POC DEV2` was configured.

Configuration highlights:

- Type: OIDC enterprise provider.
- Issuer/well-known/authorize/token/userinfo endpoints point to DEV2 tenant.
- Provider enabled.
- Enable identity linking for this identity provider.
- Set external ID attribute for identity linking to `sub`.
- Identity provider ID recorded and used by backend as the source hint value.

Important implementation note:

- Custom attribute mappings in the identity provider configuration were removed for this POC.
- Attribute mappings were not required for successful routing and linking in this tested setup.

## 3) Linking DEV app to DEV identity provider

In DEV tenant OIDC app (main app):

- Sign-on policy includes supported identity providers.
- Provincial provider can be enabled.
- Cloud Directory can also be enabled.

Critical behavior discovered:

- When only provincial provider is enabled, provincial flow reliably reaches DEV2.
- When Cloud Directory is also enabled, hosted login may default to DEV Cloud Directory depending on policy precedence, even when source hint is sent.

## 4) Frontend and backend integration

### Frontend

Provincial partner cards in:

- `frontend/src/features/IDV/Online/ProvincialVerificationPage.tsx`

Behavior:

- BC and AB card clicks call backend login endpoint with partner key.
- `returnToPage` points to `online/provincial/link/:partnerId/success`.
- Nested `returnToPage` propagation bug was fixed by stripping existing `returnToPage` from query params before building the next login URL.

### Backend

Main login handler:

- `backend/app/auth/services/auth.py`
- `redirect_user_to_idp_verify(request, prompt, returnToPage, partner)`

Behavior:

- Validates partner key.
- Maps partner to configured provincial identity provider ID.
- Sends `identity_source_id` as extra authorize parameter.
- Rewrites Verify hosted login URL to `/auth/{identity_source_path_segment}?Target=...&app_login=false` for provincial partner requests, where the path segment currently uses `IBM_VERIFY_PROVINCIAL_PARTNERS_IDENTITY_SOURCE_ID`.
- Stores return path in session.

Callback handler:

- Fixed nested redirect issue by redirecting directly to stored `returnToPage` path instead of appending `returnToPage` query to itself.

## 6) Runtime behavior observed by account state

Observed behavior in DEV tenant:

- User with no existing linked identity for this provincial flow:
  - Provincial click routes to DEV2 authentication as expected.
- User with existing linked identity:
  - Without `/auth/...` routing, Verify can route into local broker policy paths (for example `authsvc` with `PolicyId=...macotp`) instead of DEV2.
  - With `/auth/...` routing enabled in current POC implementation, routing remains on the intended provincial path in testing.

Interpretation:

- `identity_source_id` alone can behave like a hint.
- Entering through a dedicated `/auth/...` route affects policy selection earlier in the hosted login chain.

## 5) Testing and validation completed

End-to-end observations:

- Provincial click correctly calls `/v1/auth/login?...&partner=bc` (or `partner=ab`).
- DEV authorize redirect includes source hint and callback params.
- Callback reaches `/v1/auth/callback` and redirects to `online/provincial/link/:partnerId/success`.
- DEV2 metrics can show authentication events when policy is constrained appropriately.

Automated tests:

- Backend auth tests in `backend/tests/test_auth.py` were kept green during changes.
- Frontend provincial page tests were updated for link-building and query behavior.

## Current known limitation

- `/auth/...` route behavior is observed and validated in tenant testing, but not explicitly documented as a stable public API contract in Verify Reference docs.
- Deterministic behavior still depends on tenant policy configuration behind the selected auth route.

## Why this happens

- Source selection is strongly influenced by DEV OIDC app sign-on policy and hosted login policy routing.
- Redirect URI settings and group membership source settings do not enforce provider choice.
- `/auth/...` entry routing changes which hosted-login policy path executes before final authorize processing.

## Recommended next steps

Option A (recommended for deterministic behavior):

- Use dedicated OIDC app policy isolation for provincial flow, separate from main sign-in flow.
- Keep Cloud Directory on main app.
- Constrain provincial flow app to provincial providers only.

Option B (strongest deterministic isolation):

- One OIDC app per provincial provider (for example BC app, AB app).
- Backend maps partner to corresponding app login flow.

Option C (current POC implementation):

- Keep one app and one provincial identity source ID config.
- Use `/auth/{identity_source_id}` routing plus `Target` for provincial partner clicks.
- Keep validating behavior in tenant after policy changes.

## Notes for future contributors

- Treat both `identity_source_id` and `/auth/...` routing behavior as tenant-observed behavior unless IBM publishes explicit precedence/contract documentation for the hosted login path used.
- Always validate with both browser network traces and tenant audit/metrics.
- Keep return path handling clean to avoid nested `returnToPage` loops.
