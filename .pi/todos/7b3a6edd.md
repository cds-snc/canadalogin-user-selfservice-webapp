{
  "id": "7b3a6edd",
  "title": "Convert frontend React (Vite) from JavaScript to TypeScript",
  "tags": [
    "frontend",
    "typescript",
    "vite",
    "react",
    "migration",
    "epic"
  ],
  "status": "open",
  "created_at": "2026-02-26T15:48:31.253Z"
}

Goal

Convert the frontend folder (Vite + React) from JavaScript to TypeScript to gain type safety, improved DX, and better maintainability.

Updated scope & approach (refined)

- Keep migration incremental and reversible using small PRs.
- Use tsconfig.app.json with allowJs=true during migration.
- Centralize domain types under frontend/src/types/ and promote high-confidence types first.
- Use codemods to update imports when renaming files to avoid manual churn.

Progress (work started)

- Extracted declaration baseline and analyzed exported symbols (frontend/types-extracted/, frontend/migration/declarations-report.json).
- Promoted initial domain types and created new type files:
  - frontend/src/types/fido2.ts
  - frontend/src/types/webauthn.ts
  - frontend/src/types/hooks.ts
- Exported new types from frontend/src/types/index.ts
- Updated source modules to consume new types:
  - frontend/src/features/ManageFIDO2/utils/fetchUserFIDO2Credentials.ts now uses Fido2Credential
  - frontend/src/hooks/useSubmit.tsx now imports SubmitDataOptions and SubmitData from src/types/hooks

Top-level deliverables

- A set of small, reviewable PRs converting files from .js/.jsx to .ts/.tsx (Batch A..F)
- Domain types in frontend/src/types/ (initial set added)
- A codemod to update imports after renames (todo created)
- CI job to run tsc --noEmit (non-blocking initially)
- README updated with migration steps and local verification instructions

Subtasks (created)

- TODO-c6d28574: Promote domain types into frontend/src/types and stabilize exports (in progress)
- TODO-574f3227: Extract declarations and analyze (emitDeclarationOnly) — completed
- TODO-0f349871: Create codemod: remove .js/.jsx extensions from imports (dry-run + apply)
- TODO-c33412ca: Batch A — Convert small utilities to TypeScript (PR 1)
- TODO-d972b30a: Batch B — Convert services & API clients to TypeScript (PR 2)
- TODO-02e15fda: Batch C — Convert hooks to TypeScript (PR 3)
- TODO-49a95380: Batch D — Convert providers & layout components to TypeScript (PR 4)
- TODO-a89ed09e: Batch E — Convert routes/pages and app entry (PR 5)
- TODO-41f10428: Batch F — Convert stories and tests (final, optional)
- TODO-a308bd6c: Add CI job: non-blocking typecheck (tsc --noEmit) and build check
- TODO-69cb279d: Add PR checklist & branch naming conventions for TypeScript migration
- TODO-5ce75680: Documentation: Add migration notes to frontend/README.md

Per-file conversion rule

- For any converted file:
  - rename with git mv to .ts/.tsx
  - update imports in dependents (prefer codemod)
  - add conservative types (use any with TODO if needed)
  - run: npm --prefix frontend ci && npm --prefix frontend run build
  - open PR <= 15 files; include TODO list and request type-review

Acceptance criteria (epic)

- All converted PRs build successfully (npm --prefix frontend run build)
- Types are centralized under frontend/src/types/ and used by converted modules
- CI reports type errors (non-blocking initially) and build artifacts on PR
- README updated with migration documentation

Notes & references

- Inventory: frontend/migration/inventory.json (file sizes & complexity)
- Declarations analysis: frontend/migration/declarations-report.json and .md
- Scripts added: frontend/tsconfig.extract.json, frontend/scripts/generate-inventory.cjs, frontend/scripts/analyze-declarations.cjs

Next immediate actions

- Continue Batch A conversions (convert small utilities) and update imports
- After Batch A, convert services (Batch B) and verify build

Tags

- frontend, typescript, migration, epic
