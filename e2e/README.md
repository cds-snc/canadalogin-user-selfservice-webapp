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
    ├── auth.setup.ts   # signs in, opens /en/profile from the dashboard, checks Identity details, saves the session
    └── idv/            # IDV journeys
```

Assertions use the frontend's own translation files (`frontend/src/i18n/locales`) through `support/i18n.ts`, so copy changes don't break tests.

## Prerequisites

- The target frontend must have the IDV routes enabled (`VITE_ENVIRONMENT=dev` or `test`).
- Test users must not be prompted for OTP/MFA. In dev/test tenants, add them to an MFA-exempt group (e.g. `MFA_Exempt`) that the self-service app's access policy allows without MFA, rather than removing the policy for everyone.
- Two test users in the target IBM Verify tenant:
  - **User A** (`E2E_PROVEN_USER_*`) has completed fake ID proofing.
  - **User B** (`E2E_UNPROVEN_USER_*`) has no ID proofing data. The tests assume this and don't reset it, so don't use this account to complete ID proofing.

## Environment variables

Set these in your shell, in CI secrets, or in an untracked `e2e/.env` file (git-ignored, loaded automatically).

| Variable                                | Required                             | Description                                                                 |
| --------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------- |
| `E2E_BASE_URL`                          | No (default `http://localhost:3000`) | Frontend URL, e.g. `https://local.dev.login-connexion.alpha.canada.ca:3000` |
| `E2E_API_URL`                           | No (default `http://localhost:8000`) | Backend URL; must match the frontend's `VITE_BACKEND_API_URL`               |
| `E2E_IGNORE_HTTPS_ERRORS`               | No                                   | `true` for self-signed local certificates                                   |
| `E2E_TIMEZONE`                          | No (default `America/Toronto`)       | Browser timezone, also used to compute expected dates                       |
| `E2E_PROVEN_USER_EMAIL` / `_PASSWORD`   | Yes                                  | User A's credentials                                                        |
| `E2E_UNPROVEN_USER_EMAIL` / `_PASSWORD` | Yes                                  | User B's credentials                                                        |

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

## CI

Not enabled yet. The suite runs locally only for now.

A workflow scaffold is kept in [`ci/`](./ci) for a later task:

- [`ci/e2e-tests.yml`](./ci/e2e-tests.yml): runs on PRs that change `e2e/**`, after each dev deployment, nightly, and manually (dev or test). GitHub ignores it until it's moved to `.github/workflows/`.
- [`ci/setup-e2e-environments.sh`](./ci/setup-e2e-environments.sh): creates the dedicated `e2e-dev` / `e2e-test` GitHub environments and sets their variables, prompting for secrets. Requires repository admin access.

To enable it, have an admin run the setup script, then `git mv e2e/ci/e2e-tests.yml .github/workflows/e2e-tests.yml`.

This repository is public, so workflow artifacts can be downloaded by any GitHub user. The config already disables traces and videos in CI and never records the sign-in step.

## Troubleshooting

- **403 from the API:** the API's load balancer rejects non-browser user agents, including Playwright's default `HeadlessChrome`. Every project uses the `Desktop Chrome` device profile for this reason (see `playwright.config.ts`); keep it when adding projects.
- **`E2E_BASE_URL`** must be the frontend origin without a path (e.g. `https://app.dev.login-connexion.alpha.canada.ca`, not `.../en`).
- **User B tests fail because the Identity details card is shown:** User B's account has ID proofing data. Use an account that has never completed ID proofing.

## Writing tests

- Add a page object in `pages/` for each new screen; keep selectors there, not in specs.
- Prefer `getByRole` / `getByLabel`. GCDS components use shadow DOM; Playwright's role and CSS selectors pierce it.
- Cover both `en` and `fr` by looping over `LANGUAGES`.
- Wait for the API call a page depends on (see `gotoAndWaitForClaims` in `support/navigation.ts`) before asserting that something is absent.
- Never commit credentials or anything under `.auth/` (saved sessions contain live cookies).
- Never pass secrets to `fill()`, `type()` or `keyboard.insertText()`: their values appear in step titles and reports.
