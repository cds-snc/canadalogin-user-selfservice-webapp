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
├── ci/                 # CI workflow scaffold (not enabled yet; see "CI")
└── tests/
    ├── auth.setup.ts   # per-account sign-in tests; saves sessions for dependent test projects
    └── idv/            # IDV journeys
```

Assertions use the frontend's own translation files (`frontend/src/i18n/locales`) through `support/i18n.ts`, so copy changes don't break tests.

## Prerequisites

- The target frontend must have the IDV routes enabled (`VITE_ENVIRONMENT=dev` or `test`).
- Test users must not be prompted for OTP/MFA. In dev/test tenants, add them to an MFA-exempt group (e.g. `MFA_Exempt`) that the self-service app's access policy allows without MFA, rather than removing the policy for everyone.
- Four dedicated test users in the target IBM Verify tenant:
  - **User A** (`E2E_PROVEN_USER_*`) has completed fake ID proofing.
  - **User B** (`E2E_UNPROVEN_USER_*`) has no ID proofing data. The tests assume this and don't reset it, so don't use this account to complete ID proofing. The online journey uses this account, tests both the self-photo and provincial sign-in paths, and mocks case creation to avoid creating an external IDV case.
  - **Service Canada user** (`E2E_IN_PERSON_USER_*`) is reserved for Service Canada Centre journeys.
  - **Canada Post user** (`E2E_IN_PERSON_CANADA_POST_USER_*`) is reserved for Canada Post journeys. Each provider creates in-person cases and sends verification-code emails through GC Notify; use controlled test mailboxes and a test Notify service. Separate accounts avoid the backend's per-user case-creation cooldown.

## Environment variables

Set these in your shell, in CI secrets, or in an untracked `e2e/.env` file (git-ignored, loaded automatically).

| Variable                                 | Required                             | Description                                                                 |
| ---------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------- |
| `E2E_BASE_URL`                           | No (default `http://localhost:3000`) | Frontend URL, e.g. `https://local.dev.login-connexion.alpha.canada.ca:3000` |
| `E2E_API_URL`                            | No (default `http://localhost:8000`) | Backend URL; must match the frontend's `VITE_BACKEND_API_URL`               |
| `E2E_IGNORE_HTTPS_ERRORS`                | No                                   | `true` for self-signed local certificates                                   |
| `E2E_TIMEZONE`                           | No (default `America/Toronto`)       | Browser timezone, also used to compute expected dates                       |
| `E2E_PROVEN_USER_EMAIL` / `_PASSWORD`    | Yes                                  | User A's credentials                                                        |
| `E2E_UNPROVEN_USER_EMAIL` / `_PASSWORD`  | Yes                                  | User B's credentials                                                        |
| `E2E_IN_PERSON_USER_EMAIL` / `_PASSWORD` | Yes                                  | Dedicated user for Service Canada Centre journeys                           |
| `E2E_IN_PERSON_CANADA_POST_USER_EMAIL` / `_PASSWORD` | Yes                    | Dedicated user for Canada Post journeys                                     |

## Running

```bash
cd e2e
npm ci
npm run install-browsers

npm test                 # all projects
npx playwright test --project=idv-canada-post # one project and only its required setup
npx playwright test --project=idv-online-self-photo # self-photo and ID check path
npx playwright test --project=idv-online-provincial # provincial sign-in path
npm run test:headed      # watch the browser
npm run test:ui          # Playwright UI mode
npm run report           # open the last HTML report
npm run typecheck
```

Tests run serially (`workers: 1`) because they share a small pool of test accounts. Each test project depends only on the account setup it needs: each provider journey and each proven-information user suite signs in only its corresponding user. The tests reuse saved storage state, so the number of test cases does not increase IBM Verify sign-ins. Auth setup tests are not retried because retrying would submit credentials to IBM Verify again; in-person journey tests are not retried because they create external cases subject to per-user cooldowns. Give each journey its own user before enabling parallel runs.

## CI

Not enabled yet. The suite runs locally only for now.

A workflow scaffold is kept in [`ci/`](./ci) for a later task:

- [`ci/e2e-tests.yml`](./ci/e2e-tests.yml): runs on PRs that change `e2e/**`, after each dev deployment, nightly, and manually (dev or test). GitHub ignores it until it's moved to `.github/workflows/`.
- [`ci/setup-e2e-environments.sh`](./ci/setup-e2e-environments.sh): creates the dedicated `e2e-dev` / `e2e-test` GitHub environments and sets their variables, prompting for secrets. Requires repository admin access.

To enable it, have an admin run the setup script, then `git mv e2e/ci/e2e-tests.yml .github/workflows/e2e-tests.yml`.

This repository is public, so workflow artifacts can be downloaded by any GitHub user. The config already disables traces and videos in CI and never records the sign-in step.

## Troubleshooting

- **403 from the API:** the API's load balancer rejects non-browser user agents, including Playwright's default `HeadlessChrome`. Every project uses the `Desktop Chrome` device profile for this reason (see `playwright.config.ts`); keep it when adding projects.
- **IBM Verify temporarily unavailable:** a full run signs in once per test account, not once per test. Each provider journey, User A suite, or User B suite signs in only its respective account. If the tenant is unavailable, wait for it to recover before rerunning; setup sign-ins are not automatically retried.
- **`E2E_BASE_URL`** must be the frontend origin without a path (e.g. `https://app.dev.login-connexion.alpha.canada.ca`, not `.../en`).
- **User B tests fail because the Identity details card is shown:** User B's account has ID proofing data. Use an account that has never completed ID proofing.
- **In-person journey tests fail while creating a case:** the backend environment needs a GC Notify test API key and a reachable IDV data store. Each journey creates a pending case and sends a verification-code email to its dedicated provider account.
- **In-person journey test accounts:** configure `E2E_IN_PERSON_USER_EMAIL` and `E2E_IN_PERSON_USER_PASSWORD` for Service Canada, and `E2E_IN_PERSON_CANADA_POST_USER_EMAIL` and `E2E_IN_PERSON_CANADA_POST_USER_PASSWORD` for Canada Post. They don't use or modify User A or User B.

## Writing tests

- Add a page object in `pages/` for each new screen; keep selectors there, not in specs.
- Prefer `getByRole` / `getByLabel`. GCDS components use shadow DOM; Playwright's role and CSS selectors pierce it.
- Cover both `en` and `fr` by looping over `LANGUAGES`.
- Wait for the API call a page depends on (see `gotoAndWaitForClaims` in `support/navigation.ts`) before asserting that something is absent.
- Never commit credentials or anything under `.auth/` (saved sessions contain live cookies).
- Never pass secrets to `fill()`, `type()` or `keyboard.insertText()`: their values appear in step titles and reports.
