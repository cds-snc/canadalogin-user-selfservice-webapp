#!/usr/bin/env bash
# Creates the e2e-dev and e2e-test GitHub environments used by the CI workflow
# scaffold in e2e/ci/e2e-tests.yml (not enabled yet). Must be run by a repository admin.
# Prerequisite: `gh auth login` as an account with admin access to the repo.
set -euo pipefail

REPO="cds-snc/canadalogin-user-selfservice-webapp"

# Environments with no protection rules: required reviewers would block scheduled and
# post-deploy runs, and deployment-branch restrictions would block PR runs.
for ENV in e2e-dev e2e-test; do
  gh api --method PUT "repos/${REPO}/environments/${ENV}" --silent
  echo "Created environment ${ENV}"
done

# Non-secret variables for dev.
gh variable set E2E_BASE_URL --env e2e-dev --repo "${REPO}" --body "https://app.dev.login-connexion.alpha.canada.ca"
gh variable set E2E_API_URL --env e2e-dev --repo "${REPO}" --body "https://api.dev.login-connexion.alpha.canada.ca"
echo "Set e2e-dev variables"

# Secrets: gh prompts for each value with hidden input, so they never appear in
# shell history or this file.
for SECRET in \
  E2E_PROVEN_USER_EMAIL E2E_PROVEN_USER_PASSWORD \
  E2E_UNPROVEN_USER_EMAIL E2E_UNPROVEN_USER_PASSWORD \
  E2E_IN_PERSON_USER_EMAIL E2E_IN_PERSON_USER_PASSWORD; do
  echo "Enter ${SECRET} for e2e-dev:"
  gh secret set "${SECRET}" --env e2e-dev --repo "${REPO}"
done

echo
echo "Done. Review at https://github.com/${REPO}/settings/environments"
echo "e2e-test was created empty; repeat the variable/secret steps with --env e2e-test when test users exist there."
