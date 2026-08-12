# IDV Data Store Integration Layer Proposal

This document proposes a central integration layer for all communication from the selfservice backend to idv-data-store.

The goal is to give backend developers a single, predictable API for delegated-user IDV operations while keeping token exchange, scope selection, endpoint resolution, and HTTP error handling in one place.

## Goals

- Centralize all idv-data-store communication behind one backend-facing service.
- Hide IBM Verify token exchange from feature modules.
- Give developers a stable API shaped like:
  - `service.create_identity_verification_case(payload)`
  - `service.claims().get()`
- Keep request-scoped dependencies explicit.
- Reduce duplicated plumbing across online, claims, and in-person IDV flows.

## Proposed Backend API

The recommended usage is a request-scoped service instance:

```python
identity_data_service = IdentityDataService(
    http_client=request.app.state.request_client,
    user_access_token=user_access_token,
)

case = await identity_data_service.create_identity_verification_case(
    service_canada_payload
)

claims = await identity_data_service.claims().get()
```

This is preferred over a static API such as `IdentityDataService.create_identity_verification_case(...)` because every call depends on two runtime values:

- the shared `AsyncClient`
- the authenticated user's access token

Those values only exist at request time, so the service should be instantiated per request or provided through a FastAPI dependency.

## Why a Central Integration Layer

Today, the backend's idv-data-store plumbing is spread across multiple modules:

- token exchange logic
- scope selection
- endpoint resolution
- request header construction
- response parsing
- upstream error mapping

That distribution makes the integration harder to extend and easier to misuse. A feature module should not need to know:

- which delegated scope to request
- how to exchange the user's token
- which endpoint path to call
- which headers or idempotency values to send

The integration layer should own all of that.

## Design Overview

The proposed design has three layers:

1. `IdentityDataService` facade
2. shared transport and authentication logic
3. grouped operation namespaces such as claims, online, and in-person

Conceptually:

```text
router/service module
  -> IdentityDataService
    -> scoped token exchange
    -> shared HTTP request helper
    -> idv-data-store endpoint
```

## Proposed Service Shape

```python
class IdentityDataService:
    def __init__(self, http_client: AsyncClient, user_access_token: str):
        ...

    async def create_identity_verification_case(
        self,
        payload: CreateIdentityVerificationCaseRequest,
    ) -> CreateIdentityVerificationResponse:
        ...

    def claims(self) -> "ClaimsOperations":
        ...

    def in_person(self) -> "InPersonOperations":
        ...

    def online(self) -> "OnlineOperations":
        ...


class ClaimsOperations:
    async def get(self) -> ClaimsResponse:
        ...


class InPersonOperations:
    async def send_code(self) -> InPersonVerificationResponse:
        ...

    async def get_last_email_sent(self) -> LastEmailSentResponse:
        ...


class OnlineOperations:
    async def reissue_session(self, case_id: str) -> ReissueOnlineSessionResponse:
        ...
```

The grouped operation objects are lightweight namespaces. They should delegate back to shared transport methods on the parent service rather than implement separate authentication flows.

The dispatch helper should live on the parent integration service, not inside an
operation namespace. In other words, the design should follow a parent-owned
dispatch shape rather than an `in_person._dispatch(...)` shape.

## Authentication and Token Exchange

Token exchange should be handled only inside the integration layer.

A new token exchange should happen for every outbound idv-data-store call. The
integration layer should not reuse or cache exchanged tokens across operations,
even within the same request.

The sequence is:

1. Receive the signed-in user's IBM Verify access token.
2. Exchange it through IBM Verify's RFC 8693 token exchange flow for the
    specific operation being invoked.
3. Request only the scope needed for the target idv-data-store endpoint.
4. Send the exchanged delegated token to idv-data-store as `Authorization: Bearer <token>`.

Feature modules should never call token exchange directly.

## Scope Ownership

The integration layer should decide which scope to use for each operation.

Available idv-data-store scopes:

| Scope | Description |
| --- | --- |
| `idv:validations:write` | Submit new identity validations. |
| `idv:validations:read` | Read identity validation records. |
| `idv:validations:update` | Update elements of identity validations. |
| `idv:validations:delete` | Delete or revoke identity validations. |
| `idv:claims:query` | Execute OIDC4IDA-compliant claims queries. |
| `idv:auth:userinfo` | Fetch userinfo claims for an already-exchanged access token. |
| `idv:admin` | Administrative operations such as registry management and audit log access. |

Recommended mapping is per operation, not one broad scope per feature area.

Examples:

- `create_identity_verification_case(...)` uses `idv:validations:write`.
- `claims().get()` uses `idv:auth:userinfo`.
- a future `validation(case_id).get()` style read operation would use `idv:validations:read`.
- a future update operation would use `idv:validations:update`.
- a future revoke or delete operation would use `idv:validations:delete`.
- a future structured claims-query operation could use `idv:claims:query`.

This keeps scope management centralized and prevents accidental reuse of the wrong delegated token.

## Shared Transport Responsibilities

The shared transport layer should be the only place that knows how to:

- exchange the user token for an idv-data-store-scoped token
- perform that token exchange on every idv-data-store call
- resolve configured endpoint URLs
- build request headers
- add idempotency headers where required
- send HTTP requests through the shared `AsyncClient`
- normalize upstream failures through `RequestErrorHandler`
- validate and parse idv-data-store responses
- resolve relative URLs returned by idv-data-store into complete URLs when needed

A useful internal shape is:

```python
async def _get_scoped_token(self, scope: str) -> str:
    ...

async def _dispatch_typed(
    self,
    endpoint: str,
    *,
    scope: str,
    context: str,
    response_model: type[BaseModel],
):
    response = await self._post(
        endpoint,
        scope=scope,
        context=context,
    )
    response.raise_for_status()
    return response_model(**response.json())

async def _post(
    self,
    endpoint: str,
    *,
    scope: str,
    context: str,
    *,
    json: dict | None = None,
):
    token = await self._get_scoped_token(scope)
    ...
```

This gives the service one enforcement point for delegated authentication behavior while keeping the per-call token exchange rule consistent across all operations.

## Response Boundary

The integration layer should return typed domain objects rather than the backend's
outward-facing `ResponseModel` wrapper.

Recommended boundary:

- integration layer returns typed responses such as `CreateIdentityVerificationResponse`
- route handlers wrap those results in `ResponseModel`

Example:

```python
result = await identity_data_service.claims().get()

return ResponseModel(
    success=True,
    message="Verified identity claims retrieved successfully",
    data=result.model_dump(),
)
```

This keeps the integration client reusable and easier to test while preserving
the existing route contract.

## FastAPI Integration

To keep calling code concise, a dependency factory can create the service:

```python
def get_identity_data_service(request: Request, user_access_token: str) -> IdentityDataService:
    return IdentityDataService(
        http_client=request.app.state.request_client,
        user_access_token=user_access_token,
    )
```

Then route handlers can depend on it directly:

```python
async def handler(
    identity_data_service: IdentityDataService = Depends(get_identity_data_service),
):
    return await identity_data_service.claims().get()
```

This gives developers the ergonomics of a simple service without hiding request-scoped state.

## Proposed Responsibilities by Module

Suggested ownership, regardless of exact folder names:

- `IdentityDataService`: public facade used by backend feature modules
- transport/auth module: token exchange and low-level HTTP request execution
- claims operations: delegated userinfo retrieval and future claims-query support
- online operations: case creation and online session reissue
- in-person operations: send verification code and fetch last-email-sent metadata
- schemas module: request and response types for idv-data-store interactions

## Naming Cleanup

Token exchange should not conceptually live under a claims operation module.

Current code had a naming inconsistency where token exchange lived beside a
claims-specific module. The integration-layer refactor should correct that by
making token exchange its own transport or auth concern.

Target direction:

- `token_exchange` is a shared authentication concern
- `claims` is an operation group that uses token exchange, but does not own it

This keeps module names aligned with their actual responsibilities.

## Migration Strategy

This should be implemented incrementally.

### Phase 1

Create the new integration layer and move token exchange behind it.

### Phase 2

Refactor existing callers to use `IdentityDataService`:

- online identity verification flows
- claims retrieval
- in-person verification flows

### Phase 3

Remove old direct token-exchange imports from feature-specific modules once all callers are migrated.

## Non-Goals

This proposal does not require:

- changing the external frontend API
- changing existing router paths
- merging unrelated Bluink-specific flows into idv-data-store if they are not part of the delegated-user integration

The goal is to centralize idv-data-store integration concerns, not to redesign the full identity-verification domain.

## Assumptions To Confirm

- Token exchange belongs in a dedicated transport or auth module, not in a claims-specific module.
- `claims().get()` remains the desired developer-facing API shape even if the internal module names change.
- Scope selection is internal to the integration layer and not provided by callers.
- Every outbound idv-data-store call performs its own token exchange.
- Operation-to-scope mapping should be as narrow as possible and use the explicit idv-data-store scopes above.

## Summary

The recommended design is a request-scoped `IdentityDataService` facade that owns:

- delegated token exchange
- scope selection
- endpoint and request construction
- idv-data-store response handling

For the initial refactor, it should preserve the current `ResponseModel` return shape and clean up the token-exchange naming boundary.
The router layer can keep returning `ResponseModel`, but the integration layer itself should use the correct typed objects.

The intended developer experience becomes:

```python
await identity_data_service.create_identity_verification_case(payload)
await identity_data_service.claims().get()
```

with all authentication and transport details handled internally by the integration layer.