# IDV Data Store Integration Layer

This document describes the integration layer for all communication from the selfservice backend to idv-data-store.

## Current Module Structure

All idv-data-store integration code lives under `backend/app/identity_verification/`:

```
identity_verification/
  __init__.py
  schemas.py                            # Pydantic request/response models
  v1_router.py                          # FastAPI routes
  services/
    token_exchange.py                   # RFC 8693 token exchange against IBM Verify
    base_idv_data_store_service.py      # Shared HTTP transport base class
    in_person_identity_verification.py  # InPersonIdentityVerificationClient
    online_identity_verification.py     # OnlineIdentityVerificationClient
    create_identity_verification.py     # Bluink-specific flow (NOT idv-data-store)
    redirect_target_url.py              # Redis-backed RP target URL storage
```

`create_identity_verification.py` and `redirect_target_url.py` are **not** part of the idv-data-store integration:
- `create_identity_verification.py` — Bluink pre-registration API (separate third party)
- `redirect_target_url.py` — Redis session storage for post-IDV redirect URL

## Current Classes

### `BaseIdvDataStoreService` (`services/base_idv_data_store_service.py`)

Shared base class for all idv-data-store operations. Provides:

- `_get(endpoint, *, scope, context)` / `_post(endpoint, *, scope, context, payload, include_idempotency_key)`
- `_request(...)` — exchanges the user token via `exchange_token_for_idv_data_store`, builds headers (`Authorization`, `Accept`, optional `Idempotency-Key`), dispatches the request
- `_dispatch_request(...)` — handles localhost TLS bypass, delegates to the shared `AsyncClient`

Every outbound call performs a fresh token exchange. No tokens are cached or reused across operations.

### `InPersonIdentityVerificationClient(BaseIdvDataStoreService)` (`services/in_person_identity_verification.py`)

| Method | Endpoint | Scope config key | Returns |
| --- | --- | --- | --- |
| `send_code(payload)` | `POST /v1/identity-verifications/in-person` | `IDV_DATA_STORE_IDENTITY_VERIFICATION_SCOPES` | `ResponseModel` |
| `get_last_email_sent()` | `POST /v1/in-person-verification/last-email-sent` | `IDV_DATA_STORE_IN_PERSON_VERIFICATION_SCOPES` | `ResponseModel` |

`send_code` defaults `verification_provider` to `"service_canada"` if not provided. Response data shape:
```python
{
    "verification_code": body.get("verification_code_display"),
    "case_id": body.get("case_id"),
    "status": body.get("status"),
    "verification_expires_at": body.get("expires_at"),
}
```

Module-level functions `create_in_person_identity_verification_case` and `get_last_email_sent` instantiate the client and delegate to it. These are what the router calls:

```python
settings = get_configuration()
operation = InPersonIdentityVerificationClient(
    global_http_client,
    user_access_token,
    settings=settings,
)
return await operation.send_code(payload)
```

### `OnlineIdentityVerificationClient(BaseIdvDataStoreService)` (`services/online_identity_verification.py`)

| Method | Endpoint | Scope config key | Returns |
| --- | --- | --- | --- |
| `create_case(payload)` | `POST /v1/identity-verifications/online` | `IDV_DATA_STORE_ONLINE_VERIFICATION_SCOPES` | `CreateIdentityVerificationResponse` |
| `reissue_session(case_id)` | `POST /v1/identity-verifications/{case_id}/online-session` | `IDV_DATA_STORE_ONLINE_VERIFICATION_SCOPES` | `ReissueOnlineSessionResponse` |

`create_case` handles a `409 open_case_exists` conflict by automatically calling `reissue_session` for the existing case. Both methods resolve relative `online_verification_url` values against `IDV_DATA_STORE_BASE_URL` before returning.

Unlike in-person, online operations return typed domain objects — the router wraps them in `ResponseModel`.

### `token_exchange.py`

`exchange_token_for_idv_data_store(http_client, user_access_token, scope)` performs RFC 8693 OAuth 2.0 Token Exchange against IBM Verify using `IDV_DATA_STORE_STS_CLIENT_ID` / `IDV_DATA_STORE_STS_CLIENT_SECRET`. Returns a narrowly-scoped delegated access token sent as `Authorization: Bearer` to idv-data-store.

Called exclusively by `BaseIdvDataStoreService._request`. Feature modules must not call it directly.

## Schemas (`schemas.py`)

| Model | Purpose |
| --- | --- |
| `CreateInPersonIdentityVerificationRequest` | Router body for `POST /in-person` |
| `InPersonApplicantRequest` / `InPersonApplicantAddressRequest` | Nested applicant fields |
| `CreateOnlineIdentityVerificationRequest` | Router body for `POST /online` |
| `CreateIdentityVerificationResponse` | Typed response from `OnlineIdentityVerificationClient.create_case` |
| `ReissueOnlineSessionResponse` | Typed response from `OnlineIdentityVerificationClient.reissue_session` |
| `CaseStatus` | Enum: `pending`, `in_progress`, `verified`, `failed`, `cancelled` |
| `StoreTargetUrlRequest` | Router body for `POST /target-url` |

## Active Scopes and Config Keys

Scopes are configured in `IdvDataStoreConfig` (read from env):

| Config key | Default scope | Used by |
| --- | --- | --- |
| `IDV_DATA_STORE_IDENTITY_VERIFICATION_SCOPES` | `idv:auth:verified-claims` | `InPersonIdentityVerificationClient.send_code` |
| `IDV_DATA_STORE_IN_PERSON_VERIFICATION_SCOPES` | `idv:in-person-verification:send` | `InPersonIdentityVerificationClient.get_last_email_sent` |
| `IDV_DATA_STORE_ONLINE_VERIFICATION_SCOPES` | `idv:auth:verified-claims` | `OnlineIdentityVerificationClient` (both methods) |
| `IDV_DATA_STORE_AUTH_USERINFO_SCOPES` | `idv:auth:userinfo` | Reserved — not yet wired to a client |

## Active Endpoints

Resolved from `Configuration` properties using `IDV_DATA_STORE_BASE_URL`:

| Property | Path |
| --- | --- |
| `idv_data_store_identity_verification_in_person_endpoint` | `/v1/identity-verifications/in-person` |
| `idv_data_store_in_person_verification_last_email_endpoint` | `/v1/in-person-verification/last-email-sent` |
| `idv_data_store_online_verification_endpoint` | `/v1/identity-verifications/online` |
| `idv_data_store_online_session_endpoint(case_id)` | `/v1/identity-verifications/{case_id}/online-session` |
| `idv_data_store_userinfo_endpoint` | `/v1/auth/userinfo` |