# CanadaLogin - User self-service web application

A modern and accessible web application that allows users to make changes to their CanadaLogin. Built with a React front-end using the [GC Design System](https://github.com/cds-snc/gcds-components), and a supporting FastAPI back-end API that integrates with the IBM Verify SaaS (IdP) to handle login, logout and profile updates.

## Architecture

This solution follows a BFF (backend for frontend) architectural pattern:

- Frontend: React-based SPA
- Backend: FastAPI Python service
- Authentication and Identity Store: IBM Security Verify CIAM SaaS
- Infrastructure (AWS): ECS, ECR, ALB, Secrets Manager, CloudFront, Route 53, WAF, CloudWatch

### Local Development Setup

1. Clone the repository:

```bash
git clone https://github.com/cds-snc/gc-signin-user-selfservice-webapp.git
```

### Running the Application Locally

#### 1. Run the backend

- See the [backend README](backend/README.md)

#### 2. Run frontend

- See the [frontend README](frontend/README.md)

### Developer Tooling

#### VS Code Settings
The `.vscode/settings.json` in this repo pre-configures VS Code for the project:
- Sets the Python interpreter to the local `.venv`
- Enables pytest in the Test Explorer (see the backend README for setup)

#### Git Pre-commit Hook (optional)
A pre-commit hook is available at `.githooks/pre-commit` that mirrors the same checks run in GitHub Actions CI/CD:
- **Backend** — `black --check` (format) and `flake8` (lint) on staged Python files
- **Frontend** — `prettier` and `eslint` via `lint-staged` on staged frontend files

The hook is **opt-in** — it only activates when you run:

```bash
make setup-hooks
```

To disable it:

```bash
make uninstall-hooks
```

To bypass in a one-off situation: `git commit --no-verify`

### Additional Documentation

- [IBM Verify Documentation](https://docs.verify.ibm.com/verify/reference/overview)

### Other CanadaLogin Repos

- [CanadaLogin Terraform Repo (AWS Deployment)](https://github.com/cds-snc/gc-signin-terraform)
- [IBM Tenant Configuration Repo](https://github.com/cds-snc/gc-signin-ibm-configuration)
- [CanadaLogin Static website](https://github.com/cds-snc/gc-signin-static-website)

### AWS Deployment

See [AWS Architecture](docs/architecture/gc-signin-pilot-architecture.png) for infrastructure details and visit the [gc-signin-terraform repo](https://github.com/cds-snc/gc-signin-terraform).
