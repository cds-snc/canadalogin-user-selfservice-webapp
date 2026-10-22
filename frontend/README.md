# CanadaLogin - User self-service Frontend Application

This is the frontend application built with React and GC Design System for the Government of Canada CanadaLogin user self-service application.

## Running the Application

### Prerequisites

- node/npm should be installed on your machine or you can run this repository in a devcontainer to have them automatically available
- the back-end API should be running on port 8000 (see backend folder for instructions)

### Run the application locally

1. Install dependencies locally:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

3. Run tests:

   ```bash
   npm run test
   ```

See `package.json` scripts for additional commands.

### Pre-commit Hook (optional)

A pre-commit hook is available that runs `prettier` and `eslint` automatically on staged frontend files whenever you commit. It is **opt-in** and must be activated from the repo root:

```bash
make setup-hooks
```

To disable it:

```bash
make uninstall-hooks
```

To run the same checks manually:

```bash
# Auto-fix lint and format issues
npm run fix

# Check only (no changes written — mirrors CI)
npm run check
```

4. Run Storybook:
   ```bash
   npm run storybook
   ```

### Running Vitest

To execute a specific unit test file, specify your file path:

```bash
npx vitest src/features/ProfileName/__tests__/ProfileUpdateName.test.jsx
```

To update snapshots for a specific test:

```bash
npx vitest src/features/ProfileName/__tests__/ProfileUpdateName.test.jsx -u
```

vitest docs:

- [Vitest CLI Documentation](https://vitest.dev/guide/cli.html)

### Navigation accessibility

The shared root layout restores scrolling through `usePageScrollRestoration`,
which runs from the application bundle without injecting an inline script. It is
compatible with the backend's `script-src 'self'` Content Security Policy and
does not require a nonce or a relaxed policy.

New client-side navigations start at the top. Back and Forward restore positions
saved during the current layout's lifetime, and anchor links scroll to their
targets. Initial loads without an anchor do not force a scroll position. Scrolling
does not move keyboard focus; existing first-Tab heading focus behavior is
unchanged. This client-rendered implementation does not provide pre-paint
restoration before the application bundle loads.
