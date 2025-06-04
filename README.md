# GC Sign in

Provides a modern and accessible React front-end built with the [GC Design System](https://github.com/cds-snc/gcds-components), and a supporting FastAPI back-end API that integrates with the IBM Verify SaaS to enable OIDC single sign-on flows including Sign Up with password+MFA, Sign in and Management of a user's profile.

## Overview

**GC Sign in** integrates with IBM Security Verify to provide a secure and flexible authentication system supporting the following authentication methods.

### For initial pilot release
- Password + SMS or Voice OTP MFA authentication

### For future releases
- Passkey (FIDO2/WebAuthn) authentication
- Multi-factor authentication (MFA) using TOTP

## Architecture
This solution follows a BFF (backend for frontend) architectural pattern:
- Frontend: React-based SPA
- Backend: FastAPI Python service
- Authentication and Identity Store: IBM Security Verify CIAM
- Infrastructure (AWS): ECS, ECR, ALB, Secrets Manager, CloudFront, Route 53, WAF, CloudWatch
- Infrastructure (IBM): IBM Security Verify SaaS Tenants

### Environments
- Development (DEV)
- Staging (STAGING)
- Production (PROD)

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/cds-snc/gc-signin-ibm.git
```

### Running the Application Locally
#### 1. Run the backend
- See the [backend README](backend/README.md)
#### 2. Run frontend
- See the [frontend README](frontend/README.md)

### Additional Documentation
- [IBM Verify Documentation](https://docs.verify.ibm.com/verify/reference/overview)

### Other GC Sign in Repos
- [GC Sign in Terraform Repo (AWS Deployment)](https://github.com/cds-snc/gc-signin-terraform)
- [IBM Tenant Configuration Repo](https://github.com/cds-snc/gc-signin-ibm-configuration)
- [GC Sign in Static website](https://github.com/cds-snc/gc-signin-static-website)

### AWS Deployment
See [AWS Architecture](docs/architecture/gc-signin-pilot-architecture.png) for infrastructure details and visit the [gc-signin-terraform repo](https://github.com/cds-snc/gc-signin-terraform).
