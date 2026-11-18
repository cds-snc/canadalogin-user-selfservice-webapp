# End-to-end tests (Playwright)

Browser tests that run against a deployed (or locally running) self-service frontend + backend, signing in through IBM Verify with dedicated test accounts.

This package is separate from `frontend/` on purpose: the frontend's Vitest browser mode also depends on Playwright, and keeping E2E dependencies here avoids version coupling and keeps them out of the app build.

## Layout

```
e2e/
├── playwright.config.ts
├── pages/              # Page objects (one class per screen)
│   └── components/     # Sections shared by several screens
├── support/            # env, test users, i18n copy, API and navigation helpers
└── tests/
    ├── auth.setup.ts   # signs each test user in once and saves the session to .auth/
    └── idv/            # IDV journeys
```

Assertions use the frontend's own translation files (`frontend/src/i18n/locales`) through `support/i18n.ts`, so copy changes don't break tests.

## Prerequisites

- The target frontend must have the IDV routes enabled (`VITE_ENVIRONMENT=dev` or `test`).
- The OIDC application used by the target environment must have **no access policy** so test users aren't prompted for OTP/MFA.
- Two test users in the target IBM Verify tenant:
  - **User A** (`E2E_PROVEN_USER_*`) has completed fake ID proofing.
  - **User B** (`E2E_UNPROVEN_USER_*`) has no ID proofing data.

## Environment variables

Set these in your shell, in CI secrets, or in an untracked `e2e/.env` file (git-ignored, loaded automatically).

| Variable                                        | Required                             | Description                                                                 |
| ----------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------- |
| `E2E_BASE_URL`                                  | No (default `http://localhost:3000`) | Frontend URL, e.g. `https://local.dev.login-connexion.alpha.canada.ca:3000` |
| `E2E_API_URL`                                   | No (default `http://localhost:8000`) | Backend URL; must match the frontend's `VITE_BACKEND_API_URL`               |
| `E2E_IGNORE_HTTPS_ERRORS`                       | No                                   | `true` for self-signed local certificates                                   |
| `E2E_TIMEZONE`                                  | No (default `America/Toronto`)       | Browser timezone, also used to compute expected dates                       |
| `E2E_PROVEN_USER_EMAIL` / `_PASSWORD` / `_ID`   | Yes                                  | User A's credentials and IBM Verify user id                                 |
| `E2E_UNPROVEN_USER_EMAIL` / `_PASSWORD` / `_ID` | Yes                                  | User B's credentials and IBM Verify user id                                 |
| `E2E_IDP_URL`                                   | No                                   | IBM Verify tenant URL, used to get an admin token                           |
| `E2E_IDV_DATA_STORE_URL`                        | No                                   | idv-data-store base URL                                                     |
| `E2E_IDV_ADMIN_CLIENT_ID` / `_SECRET`           | No                                   | Client credentials with the `idv:admin` scope                               |

When all four `E2E_IDP_URL` / `E2E_IDV_*` variables are set, User B's IDV data is reset before the tests (`DELETE /v1/users/{id}` on idv-data-store). The client must be one idv-data-store trusts (`IDP_CLIENT_ID` or `IDV_DATA_STORE_STS_CLIENT_ID`). Without them, the tests check User B's state and fail with a clear message if it isn't clean.

## Running

```bash
cd e2e
npm ci
npm run install-browsers

npm test                 # all projects
npm run test:idv         # IDV suite only
npm run test:headed      # watch the browser
npm run test:ui          # Playwright UI mode
npm run report           # open the last HTML report
npm run typecheck
```

Tests run serially (`workers: 1`) because they share test accounts whose IDV state is changed by the journeys. Give each journey its own user before enabling parallel runs.

## Writing tests

- Add a page object in `pages/` for each new screen; keep selectors there, not in specs.
- Prefer `getByRole` / `getByLabel`. GCDS components use shadow DOM; Playwright's role and CSS selectors pierce it.
- Cover both `en` and `fr` by looping over `LANGUAGES`.
- Wait for the API call a page depends on (see `gotoAndWaitForClaims` in `support/navigation.ts`) before asserting that something is absent.
- Never commit credentials or anything under `.auth/` (saved sessions contain live cookies).
