# In-person Identity Verification Code Generation Flow

This document captures the end-to-end sequence for in-person verification code generation across:

- selfservice webapp frontend
- selfservice backend
- idv-data-store

It focuses on the Service Canada Centre in-person path that calls:

- frontend -> `POST /v1/identity-verification/in-person` (selfservice backend)
- backend -> `POST /v1/in-person-verification/send` (idv-data-store)

## Sequence Diagram

```mermaid
sequenceDiagram
  autonumber

  actor User
  participant FE as Frontend (ServiceCanadaCentrePage)
  participant BE as Selfservice Backend
  participant IV as IBM Verify
  participant IDS as idv-data-store API
  participant AUTH as IDS Auth Dependency (Bearer + scope)
  participant SVC as IDS In-person Service
  participant REDIS as Redis (rate limits)
  participant DB as IDS DB (in_person_verification_codes)
  participant NOTIFY as GC Notify

  User->>FE: Submit valid Service Canada Centre form
  FE->>BE: POST /v1/identity-verification/in-person (session cookie)
  BE->>BE: get_users_current_session() -> validate active user token

  alt Session missing or token inactive
    BE-->>FE: 401/401-like auth failure
    FE->>FE: handleApiError() redirects to login
  else Session valid
    BE->>IV: POST /oauth2/token (RFC 8693 token exchange)\nsubject_token=user_access_token\nscope=idv:in-person-verification:send
    IV-->>BE: exchanged delegated access_token
    BE->>IDS: POST /v1/in-person-verification/send\nAuthorization: Bearer exchanged_token

    IDS->>AUTH: get_token_claims() + require_scope(idv:in-person-verification:send)

    alt Bearer missing/invalid/scope missing
      AUTH-->>IDS: 401 or 403
      IDS-->>BE: 401 or 403
      BE-->>FE: error response
    else Bearer accepted
      IDS->>SVC: send_in_person_verification_code(token_claims)

      opt request context present
        SVC->>REDIS: enforce IP window limit (20 per 60s)
      end

      SVC->>SVC: resolve recipient email from claims\nuserinfo.email -> email -> preferred_username

      alt Email not resolvable
        SVC-->>IDS: 401 Unable to resolve user email
        IDS-->>BE: 401
        BE-->>FE: 401
      else Email resolved
        SVC->>REDIS: enforce user cooldown + daily limit\n(60s cooldown, 10/day)

        alt Rate limit exceeded
          REDIS-->>SVC: limit hit + retry_after
          SVC-->>IDS: 429 TooManyRequests
          IDS-->>BE: 429
          BE-->>FE: 429
        else Allowed
          SVC->>DB: get_active_code(user_hash, now)

          alt Active unexpired code exists
            DB-->>SVC: existing encrypted verification_code + expires_at
            SVC->>SVC: reuse existing code
          else No active code
            SVC->>SVC: generate unique code\n10 chars, A-Z0-9, 30 day expiry\nPBKDF2 hash metadata
            SVC->>DB: upsert_code(...)
          end

          SVC->>NOTIFY: POST send email template\npersonalisation.verification_code

          alt GC Notify failure
            NOTIFY-->>SVC: HTTP error/timeout
            SVC-->>IDS: mapped upstream failure
            IDS-->>BE: propagated error
            BE-->>FE: propagated error
          else Email accepted
            SVC->>DB: mark_email_sent(user_hash, sent_at)
            SVC->>REDIS: mark_successful_send()\nset cooldown + increment daily counter
            SVC-->>IDS: 200 success + verification_code + expires_at + sent_at
            IDS-->>BE: 200 pass-through response
            BE-->>FE: 200 response
            FE->>FE: navigate to /in-person/service-canada-centre/idv-code
            FE->>User: Show printable code and expiry details
          end
        end
      end
    end
  end
```

## Notes

- This flow is delegated-bearer only for idv-data-store in-person endpoints. The backend exchanges the user token first, then sends only the exchanged token to idv-data-store as `Authorization: Bearer ...`.
- Form fields entered on the Service Canada Centre page are used for frontend validation and display state on the code page. The code-generation identity for email delivery is derived from delegated token claims in idv-data-store.
- The same send endpoint is also used by the in-person pending page "resend" action, so resend attempts go through the same cooldown/daily/IP throttles.

## Related Files

- Frontend API client: `frontend/src/features/IDV/api/inPersonIdentityVerificationApi.ts`
- Frontend Service Canada page: `frontend/src/features/IDV/InPerson/ServiceCanadaCentrePage.tsx`
- Backend route: `backend/app/identity_verification/v1_router.py`
- Backend in-person service: `backend/app/identity_verification/services/in_person_identity_verification.py`
- Backend base data store service: `backend/app/identity_verification/services/base_idv_data_store_service.py`
- Backend token exchange: `backend/app/identity_verification/services/token_exchange.py`
- idv-data-store route: `app/in_person_verification/router.py`
- idv-data-store service: `app/in_person_verification/services/send_in_person_verification_code.py`
- idv-data-store auth dependency: `app/security/auth.py`
- idv-data-store repository/model: `app/in_person_verification/repository.py`, `app/in_person_verification/models.py`
