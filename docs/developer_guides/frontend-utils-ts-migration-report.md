# Frontend Utils TypeScript Migration Report

## Scope

This report covers the first migration slice for `/frontend/src/utils` in the React frontend. The scope is intentionally limited to utility modules and their production-source consumers.

Excluded from conversion scope:

- Unit tests in `__tests__`
- Story files and storybook test stories
- Storybook configuration files

Those files may still need import updates in a later compatibility pass, but they are not part of this migration wave.

## Utility Inventory

| Module | Current file | Role | Risk |
| --- | --- | --- | --- |
| `constants` | `/frontend/src/utils/constants.jsx` | Central identifiers, config-derived links, app constants | Critical |
| `functions` | `/frontend/src/utils/functions.jsx` | Content lookup, validation, formatting, language helpers | Critical |
| `routeHelpers` | `/frontend/src/utils/routeHelpers.js` | Route-id to path generation | High |
| `apiErrorHandler` | `/frontend/src/utils/apiErrorHandler.js` | API redirect and error normalization | High |
| `errorUtils` | `/frontend/src/utils/errorUtils.js` | Localized error message lookup | Medium |
| `userProfileDispatch` | `/frontend/src/utils/userProfileDispatch.jsx` | User context dispatch helper | Medium |
| `gcHelpCentreLinks` | `/frontend/src/utils/gcHelpCentreLinks.jsx` | Static help-centre links | Low |
| `gatag` | `/frontend/src/utils/gatag.jsx` | Google Analytics wrapper | Low |
| `faviconUtils` | `/frontend/src/utils/faviconUtils.js` | Browser favicon helpers | Low |

## Usage Summary

Approximate production usage based on the current source tree:

- `constants`: 80+ production imports across routes, providers, features, and services
- `functions`: 60+ production imports across feature flows and layout components
- `routeHelpers`: 30+ production imports across manage, profile, security, and feature navigation
- `apiErrorHandler`: 10+ production imports in API modules
- `userProfileDispatch`: about 8 to 10 production imports
- `errorUtils`: about 5 to 7 production imports
- `gcHelpCentreLinks`: 2 production imports
- `gatag`: 1 production import
- `faviconUtils`: 1 production import

## Dependency Order

Recommended conversion order is based on fan-out and internal dependencies.

1. Baseline prerequisites: `tsconfig.app.json`, `eslint.config.js`, package setup
2. Low-risk utilities: `gcHelpCentreLinks`, `gatag`, `faviconUtils`
3. Shared root utility: `constants`
4. Shared helper utility: `functions`
5. API and message utilities: `apiErrorHandler`, `errorUtils`
6. Dispatch helper: `userProfileDispatch`
7. Route helper: `routeHelpers`

Dependency notes:

- `constants` is the root shared utility and has no utility dependency
- `functions` depends on `constants` and locale JSON content
- `errorUtils` depends on `functions` and `constants`
- `apiErrorHandler` depends on `constants`
- `userProfileDispatch` depends on `constants`
- `routeHelpers` depends on `appRoutes` in `/frontend/src/routes.jsx`

## Shared Types To Extract First

The first type extraction pass should establish utility contracts before file renames:

- App language and profile language codes
- Page identifiers sourced from `PAGES`
- Flow and notice identifiers
- Analytics event payload shape
- Route params shape for `path()`
- API error and API error response shapes
- Variable substitution map for localized content
- Dispatch helper contract for `userProfileDispatch()`

The initial implementation is captured in `/frontend/src/types/utils.ts` so later utility conversions can import stable contracts without reintroducing implicit `any`.

## Baseline Status

The migration baseline blockers for this slice are already resolved:

1. `/frontend/tsconfig.app.json` supports mixed JS and TS source files and JSON module imports.
2. `/frontend/eslint.config.js` now lints `src/utils` and `src/types` TypeScript files with the TS parser.
3. Utility consumers now import extensionless paths, so TS implementations can be resolved directly without JS compatibility wrappers.

Remaining baseline note:

- Storybook utility fixtures under `/frontend/src/stories/Tests/utils` still emit `react-refresh/only-export-components` warnings during `npm run lint`, but those warnings are outside this migration scope.

## Production Files Most Affected

The highest-impact consumer areas are:

- `/frontend/src/routes.jsx`
- `/frontend/src/components/Providers/UserProvider.tsx`
- `/frontend/src/components/Providers/PrivateRoute.jsx`
- `/frontend/src/components/Layout/RootLayout.jsx`
- `/frontend/src/components/Layout/SessionTimeoutModal.jsx`
- `/frontend/src/components/Manage/**`
- `/frontend/src/features/**`
- `/frontend/src/services/authService.jsx`

## Replacement Strategy

1. Keep the TS and lint baseline stable while utility consumers resolve through extensionless imports.
2. Low-risk utilities are converted: `gcHelpCentreLinks`, `gatag`, `faviconUtils`.
3. Shared-core utilities are converted: `constants`, `functions`.
4. The remaining utilities in this slice are converted: `apiErrorHandler`, `errorUtils`, `userProfileDispatch`, `routeHelpers`.
5. Continue using extensionless utility imports for new consumer code.
6. After each wave, run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` from `/frontend`.

## Notes

- Prefer `.ts` for utility modules unless the module actually renders JSX.
- Prefer extensionless imports when updating consumers so future renames do not require another import sweep.
- Keep test and storybook conversion out of this slice even when those files still reference the old extensions.
- The compatibility wrapper files have been removed after consumers were updated to extensionless imports.