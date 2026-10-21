# OTP Send Daily Limit Implementation Guide

## Objective

Implement a per-account daily send limit for OTP send endpoints:

- `/v1/otp/mfa/send`, `/v1/otp/transient/send`, and `/v1/password/update/initiate`: a shared maximum of 30 sends per account per day

The limit is shared across all three endpoints. Any combination of MFA,
transient, and change-password sends counts toward the same 30-send quota, and
the 31st request is blocked.

This guide is written so a developer or coding agent can implement the change step by step.

---

## Scope and non-goals

### In scope

- Backend enforcement at service layer for all OTP send endpoints
- Redis-backed counter design that scales and auto-expires
- Security hardening for Redis key design and failure handling
- Unit/integration tests
- Error code plumbing and user-facing message support

### Out of scope

- Changing IBM Verify upstream rate limits
- Replacing existing phone-change rate limits (`phone_mfa_change_rate_limit`)

---

## Current state summary (important before coding)

- Send MFA OTP logic is in `backend/app/otp/services/send_mfa_otp.py`
- Send transient OTP logic is in `backend/app/otp/services/send_transient_otp.py`
- Change-password OTP initiation logic is in `backend/app/password/services/first_step_update_password.py`
- Existing rate-limit helper is in `backend/app/utils/phone_mfa_rate_limit.py`
- Existing send endpoints are routed in `backend/app/otp/v1_router.py`
- Existing IBM send-throttle mapping uses `otp_send_rate_limit` for specific upstream 429 message IDs

Current behavior is not a strict endpoint-wide 30/day send cap. Existing logic is focused on phone MFA/contact-phone change flows and uses a separate policy.

---

## Design decisions

## 1) Redis data model (minimize key bloat)

Use one Redis key per user account for this feature, with one shared send-count field.

- Key: `rate_limit:otp_send_daily:{user_hash}`
- Hash fields:
  - `window_start` (epoch seconds)
  - `send_count`

Why this model:

- Keeps key cardinality low (1 key per active user, not multiple keys per endpoint/day)
- Keeps MFA and transient sends in one shared bucket
- Enables atomic operations in one Lua script

## 2) Window semantics

Use rolling 24-hour windows:

- Window length: 86400 seconds
- Daily limit: 30

Why rolling window:

- Proven and simple to enforce atomically
- Avoids calendar-boundary abuse (23:59 + 00:01 burst)

## 3) Atomicity and race-safety

Use a Lua script for check-and-increment in one operation.

Why:

- Prevents race conditions at high concurrency
- Avoids non-atomic GET then INCR patterns

## 4) Security posture on Redis failures

Recommended for production:

- Fail closed for this control in prod/staging when Redis is unavailable
- Return HTTP 503 with a stable backend error code

Recommended for local/dev/test:

- Allow session fallback to preserve local ergonomics

Why:

- Account-level enforcement is not reliable without shared Redis
- Session-only fallback can be bypassed with new sessions

## 5) PII-safe keying

Never place raw user identifiers in Redis keys.

- Derive `user_hash` using HMAC-SHA256 with app secret/salt
- Example: first 32-40 hex chars of HMAC digest

Why:

- Prevent keyspace leakage of emails or IDs
- Shorter keys reduce memory

---

## Step-by-step implementation

## Step 1: Add constants and endpoint bucket enum

File: `backend/app/utils/phone_mfa_rate_limit.py`

Add constants near existing limiter constants:

- `OTP_SEND_DAILY_LIMIT = 30`
- `OTP_SEND_DAILY_WINDOW_SECONDS = 24 * 60 * 60`
- `OTP_SEND_DAILY_REDIS_KEY_PREFIX = "rate_limit:otp_send_daily:"`
- `OTP_SEND_DAILY_ERROR_CODE = "otp_send_daily_limit"`
- `OTP_SEND_LIMITER_UNAVAILABLE_ERROR_CODE = "otp_send_limiter_unavailable"`

Add the shared counter field:

- `OTP_SEND_FIELD = "send_count"`
- `OTP_SEND_WINDOW_START_FIELD = "window_start"`

Do not remove existing phone/contact limit constants.

## Step 2: Add key-derivation helpers

File: `backend/app/utils/phone_mfa_rate_limit.py`

Add helper functions:

1. `def _hash_user_id_for_rate_limit(user_id: str) -> str`
2. `def _build_otp_send_daily_key(user_id: str) -> str`

Implementation notes:

- Use HMAC-SHA256 (`hmac` + `hashlib`) with a secret from config
- Prefer a dedicated env/config salt if available; otherwise reuse an existing server secret
- Return a truncated hex digest for shorter keys

Example output key:

- `rate_limit:otp_send_daily:0f4c1a...`

## Step 3: Add Lua script for atomic consume

File: `backend/app/utils/phone_mfa_rate_limit.py`

Add a script constant, for example `OTP_SEND_DAILY_CONSUME_SCRIPT`, that:

1. Reads `window_start`
2. Resets hash fields if window expired
3. Reads the endpoint-specific count field
4. If count >= limit, returns blocked + retry_after
5. Otherwise increments count and sets key TTL
6. Returns allowed + new count + remaining

Suggested TTL policy:

- `EXPIRE key window_seconds + 3600`

The +3600 buffer prevents accidental early eviction if clocks drift slightly.

## Step 4: Add a generic consume function

File: `backend/app/utils/phone_mfa_rate_limit.py`

Add:

- `async def _consume_otp_send_daily_quota(request: Request, user_id: str) -> None`

Behavior:

1. Get Redis client from request state (reuse existing helper)
2. If Redis unavailable:
   - prod/staging: raise `HTTPException(503, detail=OTP_SEND_LIMITER_UNAVAILABLE_ERROR_CODE)`
   - local/dev/test: fallback to session implementation (optional), with same 30/24h logic
3. Run Lua script via `redis.eval`
4. If blocked, raise `HTTPException(429, detail=OTP_SEND_DAILY_ERROR_CODE)`
   - include `Retry-After` header if retry_after is returned

Important:

- This should be a single consume operation, not separate assert and record calls
- Avoid non-atomic two-step check/record patterns for this new control

## Step 5: Add endpoint-specific wrappers

File: `backend/app/utils/phone_mfa_rate_limit.py`

Add public functions:

- `async def consume_mfa_send_daily_quota(request: Request, user_id: str) -> None`
- `async def consume_transient_send_daily_quota(request: Request, user_id: str) -> None`

Both wrappers call the generic consume function against the same shared
`OTP_SEND_FIELD` counter.

## Step 6: Integrate MFA send endpoint

File: `backend/app/otp/services/send_mfa_otp.py`

1. Import `consume_mfa_send_daily_quota`
2. In `handle_send_mfa_otp`, after profile/user_id is resolved and before dispatch call:
   - `await consume_mfa_send_daily_quota(request, user_id)` when `request` is not `None`
3. Keep existing business-specific phone-change limiter behavior unchanged

Result:

- Every `/mfa/send` request consumes from the shared OTP daily send bucket

## Step 7: Integrate transient send endpoint

File: `backend/app/otp/services/send_transient_otp.py`

1. Import `consume_transient_send_daily_quota`
2. In `handle_otp_send`, after user_id is resolved and before dispatch call:
   - `await consume_transient_send_daily_quota(request, user_id)` when `request` is not `None`
3. Keep existing contact-phone-update limiter behavior unchanged

Result:

- Every `/transient/send` request consumes from the shared OTP daily send bucket

## Step 8: Integrate change-password OTP initiation

File: `backend/app/password/services/first_step_update_password.py`

1. Pass the request from `/v1/password/update/initiate` into the service
2. After the authenticated profile is resolved and before calling IBM Verify's password resetter:
   - `await consume_mfa_send_daily_quota(request, user_profile_response.id)` when `request` is not `None`
3. Count repeated initiation requests as new sends; do not count OTP validation or password completion

Result:

- Every `/v1/password/update/initiate` request consumes from the shared OTP daily send bucket

## Step 9: Preserve HTTPException headers in global handler

File: `backend/app/utils/global_error_handlers.py`

Current handler builds `JSONResponse` without passing `exc.headers`.

Update `http_exception_handler` to forward headers:

- `JSONResponse(..., headers=exc.headers)` when present

Why:

- `Retry-After` should reach clients and observability tooling

## Step 9: Add/adjust tests for new limiter utility

File: `backend/tests/test_phone_mfa_rate_limit.py`

Add tests for:

1. Endpoint bucket independence in same user key
   - 30 MFA sends does not block transient sends
2. MFA bucket blocks on 31st consume
3. Transient bucket blocks on 31st consume
4. Redis key format does not expose raw user ID/email
5. Window reset after 24h
6. Redis unavailable behavior:
   - prod/staging fail closed
   - local/dev/test fallback path (if implemented)

If using Lua script, mock `redis.eval` return values and cover blocked/allowed branches.

## Step 10: Add/adjust service tests

Files:

- `backend/tests/test_verify_mfa_otp.py`
- `backend/tests/test_send_transient_otp.py`

Add assertions that:

- `consume_mfa_send_daily_quota` is awaited once in MFA send handler tests
- `consume_transient_send_daily_quota` is awaited once in transient send handler tests
- Existing phone-change/contact-update limiter tests remain valid

Add at least one test per service for blocked behavior:

- mock consume function raising `HTTPException(429, detail="otp_send_daily_limit")`
- assert response message code is preserved through error pipeline

## Step 11: Frontend error message plumbing

Files:

- `frontend/src/i18n/locales/en/common.json`
- `frontend/src/i18n/locales/fr/common.json`

Add key:

- `Error.otp_send_daily_limit`

Suggested English copy:

- "You have reached the daily limit for verification code requests. Try again in 24 hours."

French locale policy in this repo currently allows English placeholder until official French copy is provided.

## Step 12: Telemetry and logging (PII-safe)

Add warning-level log on limit block in utility function with fields:

- shared OTP send bucket
- hashed user id (never raw)
- retry_after seconds

Do not log raw email, phone, OTP destination, or token data.

## Step 13: Verification commands

Backend targeted tests:

- `cd backend && pytest tests/test_phone_mfa_rate_limit.py -q`
- `cd backend && pytest tests/test_send_transient_otp.py -q`
- `cd backend && pytest tests/test_verify_mfa_otp.py -q`

Then broader regression:

- `cd backend && pytest -q`

Frontend message checks:

- `cd frontend && npm run test`

---

## Redis security and scale checklist

Use this checklist before merging:

1. Redis transport is TLS in non-local environments
2. Redis auth is enabled (password/ACL)
3. Keys contain no raw user identifiers
4. New limiter uses atomic check+increment (Lua)
5. Key cardinality is bounded:
   - one key per active user for this feature
6. Keys auto-expire
7. No unbounded Redis collections (no lists/zsets growing per event)
8. Error path does not silently bypass limits in prod/staging

---

## Capacity planning notes

With one key per active sender in a 24h window:

- key count ~= active users who hit send OTP in last 24h
- each key stores 3 small hash fields and short key name

Rough sizing approach:

1. In staging, sample with `MEMORY USAGE <key>`
2. Estimate total memory as:
   - `avg_bytes_per_key * active_users_24h`
3. Add 20-30% overhead for allocator fragmentation and bursts

Set alerts for:

- Redis memory usage percent
- Evictions (`evicted_keys`)
- Error-rate spike on `otp_send_daily_limit` and limiter unavailable code

---

## Rollout plan

1. Merge backend utility + service integration + tests
2. Merge frontend error key
3. Deploy to staging
4. Run scripted validation:
   - confirm 30 combined sends are allowed and the 31st is blocked
   - confirm 29 sends through one endpoint plus 1 send through the other blocks the next send
   - confirm MFA and transient sends use the same Redis key
5. Monitor Redis metrics and API 429 patterns for 24-48h
6. Promote to production

Optional safer rollout:

- Add a temporary config flag to run limiter in monitor-only mode (log-only)
- Enable enforcement after validating expected traffic patterns

---

## Acceptance criteria

Implementation is complete when all are true:

1. A single account can make at most 30 combined `/v1/otp/mfa/send`, `/v1/otp/transient/send`, and `/v1/password/update/initiate` calls in 24h
2. The 31st send is blocked regardless of which endpoint receives it
3. MFA, transient, and change-password sends use the same expiring, PII-safe Redis key
4. Enforcement is race-safe under concurrent requests
5. Redis keys are bounded, expiring, and PII-safe
6. Tests pass and include both success and blocked scenarios
7. Frontend shows a clear, translatable error message for this limit

---

## Suggested future hardening (post-implementation)

- Add per-IP burst limits at the edge/API gateway in addition to per-account limits
- Add endpoint-level anomaly detection (sudden spikes by account/device)
- Add a small anti-automation challenge after repeated sends near threshold
- Emit metrics per endpoint bucket for better abuse analytics
