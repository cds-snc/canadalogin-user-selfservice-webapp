# AGENTS.md — GC Sign In Manage App

## Project Overview

Government of Canada user self-service web app for managing GC Sign In accounts. BFF architecture: React frontend + FastAPI backend integrating with IBM Security Verify (CIAM IdP). Bilingual (EN/FR).

## Repository Structure

```
backend/          # FastAPI Python service (port 8000)
  app/            # Application code (routers, services, schemas, utils)
  tests/          # Pytest test files (test_*.py)
frontend/         # React SPA (port 3000)
  src/
    components/   # Shared UI components (Layout, Providers, Wizard, etc.)
    features/     # Feature modules (ProfileName, ChangePassword, FIDO2, etc.)
    hooks/        # Custom React hooks (useSubmit, useOtpOperations, etc.)
    services/     # API service modules (authService)
    locales/      # i18n JSON files (en/en.json, fr/fr.json)
    utils/        # Shared utilities and constants
    stories/      # Storybook stories
docs/             # Architecture diagrams and documentation
```

## Build, Lint, and Test Commands

### Frontend (run from `frontend/`)

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build (Vite) |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format |
| `npm run format:check` | Prettier check (CI) |
| `npm run check` | Run lint + format check together |
| `npm run test` | Run all Vitest tests with coverage |
| `npx vitest src/path/to/File.test.jsx` | **Run a single test file** |
| `npx vitest src/path/to/File.test.jsx -u` | Update snapshots for a single test |
| `npm run storybook` | Start Storybook on port 6006 |

### Backend (run from repo root unless noted)

| Command | Description |
|---------|-------------|
| `make install-python` | Install runtime Python deps |
| `make install-dev-python` | Install dev + runtime Python deps |
| `make run-pytest` | Run all pytest tests with coverage |
| `pytest backend/tests/test_file.py -v` | **Run a single test file** |
| `pytest backend/tests/test_file.py::test_name -v` | **Run a single test function** |
| `make lint-python` | Flake8 lint |
| `make fmt-python` | Black format |
| `make fmt-ci-python` | Black format check (CI) |
| `make docker-build` | Build backend Docker image |

Backend tests require env vars (can be dummy values for mocks):
```bash
export IBM_VERIFY_TENANT_URL=abc123
export IBM_VERIFY_API_CLIENT_ID=abc123
export IBM_VERIFY_API_CLIENT_SECRET=abc123
export IBM_VERIFY_PROFILE_MANAGEMENT_API_CLIENT_ID=abc123
export IBM_VERIFY_PROFILE_MANAGEMENT_API_SECRET=abc123
export IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID=abc123
export IBM_VERIFY_PROFILE_MANAGEMENT_SECRET=abc123
```

## Code Style — Frontend

### Language and Framework
- React 19 with Vite. Predominantly JavaScript (.jsx), some TypeScript (.tsx) for hooks and providers.
- GC Design System (`@cdssnc/gcds-components-react`) for UI components. Import `gcds.css` globally.
- Routing via `react-router` v7. State via React Context + `useReducer` (no Redux/Zustand).
- API calls via `axios` with `axios.defaults.withCredentials = true`.

### File Naming
- **Components**: `PascalCase.jsx` (e.g., `EditProfileNamePage.jsx`, `SessionTimeoutModal.jsx`)
- **Hooks**: `useCamelCase.tsx` or `.js` (e.g., `useSubmit.tsx`, `useOtpOperations.js`)
- **Services/Utils**: `camelCase.jsx` or `.js` (e.g., `authService.jsx`, `apiErrorHandler.js`)
- **Tests**: `*.test.jsx` in `__tests__/` directories colocated with source

### Imports
- ES modules only (`import`/`export`). Include file extensions on local imports (`.jsx`, `.tsx`, `.js`).
- Order: external packages first, then local utils/config, then components, then relative imports.
- No path aliases — use relative paths (`../../utils/constants.jsx`).

### Components
- Functional components with hooks. No class components.
- `export default function ComponentName()` pattern for page/feature components.
- Named exports for service objects (`export const authService = { ... }`).

### TypeScript Conventions (where used)
- Interfaces use PascalCase without `I` prefix (e.g., `UserProfile`, `SubmitDataOptions`).
- Colocate interfaces in the same file as the component/hook that uses them.
- Use `export interface` when shared across files.

### Error Handling
- API modules: wrap in `try/catch`, call `handleApiError(error)` from `utils/apiErrorHandler.js`.
- `handleApiError` redirects to login on 401, re-throws otherwise.
- No custom Error subclasses. Use `console.error` for unexpected errors.

### i18n / Bilingual
- JSON locale files at `src/locales/en/en.json` and `src/locales/fr/fr.json`.
- Access content via `getPageContent(language, PAGES.pageName)` from `utils/functions.jsx`.
- Every user-visible string must exist in both locale files.

### Styling
- GC Design System components + global CSS. Class names in kebab-case (e.g., `session-timeout-modal`).
- No CSS modules or styled-components. Utility classes like `mt-3` are used sparingly.

### Testing (Frontend)
- **Runner**: Vitest with jsdom environment.
- **Libraries**: `@testing-library/react`, `@testing-library/jest-dom`.
- **Mocks**: `vi.mock("axios")` for API mocking; MSW for Storybook.
- **Pattern**: Arrange / Act / Assert with descriptive test names.
- Tests colocated in `__tests__/` folders adjacent to source files.

### Formatting and Linting
- **ESLint**: Flat config (`eslint.config.js`). Rules: recommended + react-hooks + react-refresh. `no-unused-vars` ignores names starting with uppercase or underscore.
- **Prettier**: Default config (no overrides). Runs via `npm run format`.
- **Husky + lint-staged**: Pre-commit runs ESLint fix + Prettier on staged `.js/.jsx/.ts/.tsx` files.

## Code Style — Backend

### Language and Framework
- Python 3.12+ with FastAPI. Async handlers (`async def`).
- Pydantic v2 for schemas/validation. `pydantic-settings` for configuration.
- `httpx.AsyncClient` for outbound HTTP. `redis.asyncio` for session store.

### File Naming
- `snake_case.py` throughout (e.g., `get_my_profile.py`, `v1_router.py`).
- Tests: `test_*.py` in `backend/tests/` (flat structure, not nested).

### Imports
- Standard library first, then third-party, then `app.*` local imports.
- Use absolute imports from `app` package (e.g., `from app.users.schemas import ...`).
- Relative imports (`.routers`) only within the same package for router includes.

### Schemas and Types
- Pydantic `BaseModel` subclasses for all request/response schemas.
- PascalCase class names (e.g., `UserProfileUpdateRequest`, `IBMVerifyUserProfileSchema`).
- Standard `ResponseModel(success, message, data)` wrapper for all API responses.
- Use `Optional[T] = None` for optional fields. Use `Field(...)` for descriptions/defaults.

### Router Patterns
- One router per domain module (`v1_router.py`), included in `main.py` with versioned prefix.
- Use `Depends()` for auth/session injection (`get_users_current_session`).
- Response models declared on route decorators (`response_model=ProfileResponse`).

### Error Handling
- Raise `HTTPException` with appropriate status codes.
- Use `generate_error_response()` from `app.utils.helpers` for structured error JSONs.
- Global exception handlers in `main.py` for `RequestValidationError`, `HTTPException`, `OAuthError`.

### Formatting and Linting
- **Black**: Target Python 3.11+, max line length 130 (via `.flake8`).
- **Flake8**: Ignores W503, W504, E203, E501. Max complexity 16.
- Format: `make fmt-python`. Lint: `make lint-python`.

### Testing (Backend)
- **Runner**: pytest with pytest-asyncio for async tests.
- **Mocking**: `unittest.mock.patch`, `respx` for httpx request mocking, `monkeypatch` for config.
- **Pattern**: `@pytest.mark.asyncio` on all async tests. Arrange/Act/Assert with comments.
- **Coverage**: Auto-generated via `--cov=backend` (configured in `pytest.ini`).

## CI/CD

GitHub Actions workflows run on push/PR for relevant paths:
- `frontend-lint.yml`: ESLint + Prettier check (Node 20)
- `frontend-code-coverage.yml`: Vitest with coverage
- `backend-lint.yml`: Flake8 + Black check + pytest + Docker build (Python 3.14)
- `codeql.yml`: CodeQL security analysis
- `release-pipeline.yml`: Release and deployment pipeline
