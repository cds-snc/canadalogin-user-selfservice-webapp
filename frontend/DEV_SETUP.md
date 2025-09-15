# Development Setup for ESLint and Prettier

This document explains how to set up your local development environment to match the same ESLint and Prettier configurations used by GitHub Actions.

## VS Code Setup (Recommended)

The repository includes VS Code settings that will automatically:

- Enable ESLint with auto-fix on save
- Enable Prettier formatting on save
- Use the correct ESLint and Prettier configurations

### Required Extensions

Install these VS Code extensions:

1. **ESLint** (`dbaeumer.vscode-eslint`)
2. **Prettier - Code formatter** (`esbenp.prettier-vscode`)

These extensions will be suggested automatically when you open the project.

## Available NPM Scripts

Run these commands to check and fix code style issues:

```bash
# Check both ESLint and Prettier (same as GitHub Actions)
npm run check

# Fix both ESLint and Prettier issues automatically
npm run fix

# ESLint only
npm run lint          # Check for issues
npm run lint:fix      # Fix issues automatically

# Prettier only
npm run format:check  # Check formatting (same as GitHub Actions)
npm run format        # Fix formatting

# Run the same checks as GitHub Actions (includes tests)
npm run pre-push
```

## Automatic Code Quality Checks

### Pre-commit Hooks

The repository uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to automatically run ESLint and Prettier on staged files before each commit.

When you run `git commit`, it will:

1. Run ESLint with auto-fix on staged JS/TS files
2. Run Prettier on staged files
3. Add the fixed files back to the commit

### VS Code Tasks

You can run these tasks from VS Code (Cmd/Ctrl + Shift + P → "Tasks: Run Task"):

- **ESLint: Check All Files**
- **ESLint: Fix All Files**
- **Prettier: Check Formatting**
- **Prettier: Fix Formatting**
- **Check All (ESLint + Prettier)**

## GitHub Actions Compatibility

The local setup matches exactly what GitHub Actions runs:

- **ESLint**: `npm run lint`
- **Prettier**: `npm run format:check`

If your local checks pass, the GitHub Actions should also pass.

## Troubleshooting

### GitHub Actions failing but local checks pass?

Make sure you're running the exact same commands:

```bash
npm run lint           # ESLint check
npm run format:check   # Prettier check (not npm run format)
```

### Want to see what files have issues?

```bash
# See which files have ESLint issues
npx eslint .

# See which files have Prettier issues
npx prettier . --check
```

### Pre-commit hooks not working?

If pre-commit hooks aren't running, reinstall Husky:

```bash
npm run prepare
```
