# GC Sign In

Provides a modern frontend and a backend proxy layer to support GC Sign In across governemntal departments across the Government of Canada.


## Overview

GC Sign In Service integrates with IBM Security Verify to provide a secure and flexible authentication system with multiple authentication methods:
- Password + MFA authentication
- Passkey (FIDO2/WebAuthn) authentication
- Multi-factor authentication (MFA) using TOTP

## Architecture

The service follows a microservices architecture:
- Frontend: React-based SPA
- Backend: FastAPI Python service
- Authentication: IBM Security Verify CIAM
- Infrastructure: AWS (ECS, ECR, ELB, Secrets Manager, CloudFront, Route 53, WAF, CloudWatch)

### Environment Strategy
- Development (DEV)
- Test/QA (TEST)
- Pre-production (PREPROD)
- Production (PROD)

See [IBM Verify Environments](docs/ibm-verify-environments.md) for detailed environment strategy.

## Features

### Authentication Methods
1. **Password + MFA**
   - Email/password authentication
   - TOTP-based second factor
   - QR code setup for authenticator apps

2. **Passkey Authentication**
   - FIDO2/WebAuthn standard
   - Biometric and PIN support
   - Cross-device authentication

3. **Multi-Factor Authentication**
   - Time-based One-Time Password (TOTP)
   - Compatible with standard authenticator apps
   - Secure enrollment process

## API Endpoints

### Authentication Endpoints

```http
POST /api/auth/signup         # User registration
POST /api/auth/signup/mfa     # MFA registration
POST /api/auth/password/signin # Password authentication
POST /api/auth/passkey/options # Get passkey authentication options
POST /api/auth/passkey/verify # Verify passkey authentication
POST /api/auth/mfa/verify     # Verify MFA code
```

## Getting Started

### Prerequisites
- Node.js 16+
- Python 3.9+
- Docker and Docker Compose
- AWS CLI (for deployment)

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/cds-snc/gc-signin-ibm.git
```

### Configuration

#### Backend Environment Variables:
```env
IBM_VERIFY_TENANT_URL=https://your-tenant.verify.ibm.com
IBM_VERIFY_CLIENT_ID=your-client-id
IBM_VERIFY_CLIENT_SECRET=your-client-secret
IBM_VERIFY_REDIRECT_URI=http://localhost:8000
```

#### Frontend Environment Variables:
```env
BACKEND_API_URL=http://localhost:8000
REACT_APP_IBM_VERIFY_URL=https://gcsignin2.verify.ibm.com/
REACT_APP_CLIENT_ID=e70df5ae-b5c4-4831-8371-2edbacd4a12c
REACT_APP_REDIRECT_URI=http://localhost:8000
```

### Running the Application

1. Frontend:
```bash
cd frontend
npm install
npm start
```

2. Backend:
```bash
cd backend
pip install -r requirements.txt
python app/main.py
```

4. Access the application at http://localhost:3000

### Documentation

- [IBM Verify Documentation](https://docs.verify.ibm.com/verify/reference/overview)
- [Mermaid Diagrams](docs/mermaid-diagrams.md)
- [AWS Architecture](docs/aws-architecture.json)
- [AWS Deployment](docs/aws-deployment.md)


Note: For local development, create a `.env` file in both the frontend and backend directories with these variables. For production deployment, these variables should be managed through your deployment platform's secrets management system.

### AWS Deployment
See [AWS Architecture](docs/aws-architecture.json) for infrastructure details.
