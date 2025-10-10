# GC Sign in - User self-service Frontend Application

This is the frontend application built with React and GC Design System for the Government of Canada GC Sign in user self-service application.

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

See package.json scripts for additional commands.

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
