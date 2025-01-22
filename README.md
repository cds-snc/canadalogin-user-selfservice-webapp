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

### Building and Pushing Docker Images to ECR

1. Authenticate Docker to ECR:
```bash
aws ecr get-login-password --region ca-central-1 | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.ca-central-1.amazonaws.com
```

2. Build the Docker images:
```bash
# Build frontend image
docker build -t gc-signin-frontend:latest -f frontend/Dockerfile frontend/

# Build backend image
docker build -t gc-signin-backend:latest -f backend/Dockerfile backend/
```

3. Tag the images:
```bash
# Tag frontend
docker tag gc-signin-frontend:latest ${AWS_ACCOUNT_ID}.dkr.ecr.ca-central-1.amazonaws.com/gc-signin-frontend:latest

# Tag backend
docker tag gc-signin-backend:latest ${AWS_ACCOUNT_ID}.dkr.ecr.ca-central-1.amazonaws.com/gc-signin-backend:latest
```

4. Push the images to ECR:
```bash
# Push frontend
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.ca-central-1.amazonaws.com/gc-signin-frontend:latest

# Push backend
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.ca-central-1.amazonaws.com/gc-signin-backend:latest
```

Note: Replace `${AWS_ACCOUNT_ID}` with your AWS account ID or set it as an environment variable:
```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
```

You can also create a helper script to automate this process:

```bash
#!/bin/bash
# build-and-push.sh

# Set variables
AWS_REGION="ca-central-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="gc-signin-dev-app"
ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Authenticate with ECR
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URL}

# Build and push frontend
echo "Building frontend image..."
docker build -t gc-signin-frontend:latest -f frontend/Dockerfile frontend/
docker tag gc-signin-frontend:latest ${ECR_URL}/gc-signin-frontend:latest
docker push ${ECR_URL}/gc-signin-frontend:latest

# Build and push backend
echo "Building backend image..."
docker build -t gc-signin-backend:latest -f backend/Dockerfile backend/
docker tag gc-signin-backend:latest ${ECR_URL}/gc-signin-backend:latest
docker push ${ECR_URL}/gc-signin-backend:latest

echo "Done!"
```

Make the script executable and run it:
```bash
chmod +x build-and-push.sh
./build-and-push.sh
```

### Terraform Deployment

The infrastructure is managed using Terraform and Terragrunt. The deployment is organized by environment and component.

#### Prerequisites
- Terraform >= 1.0
- Terragrunt >= 0.45
- AWS CLI configured with appropriate credentials
- S3 bucket for Terraform state
- DynamoDB table for state locking

#### Directory Structure
```
terraform/
├── modules/              # Reusable Terraform modules
│   ├── alb/             # Application Load Balancer
│   ├── ecr/             # Elastic Container Registry
│   ├── ecs/             # Elastic Container Service
│   └── vpc/             # Virtual Private Cloud
└── live/                # Environment-specific configurations
    ├── dev/
    ├── test/
    ├── preprod/
    └── prod/
```

#### Deployment Steps

1. Initialize Terraform backend and providers:
```bash
cd terraform/live/dev
terragrunt run-all init
```

2. Deploy VPC and networking:
```bash
cd terraform/live/dev/vpc
terragrunt apply
```

3. Deploy ECR repositories:
```bash
cd terraform/live/dev/ecr
terragrunt apply
```

4. Deploy ALB:
```bash
cd terraform/live/dev/alb
terragrunt apply
```

5. Deploy ECS cluster and services:
```bash
cd terraform/live/dev/ecs
terragrunt apply
```

#### Environment-specific Deployment

For different environments, change the directory path:
```bash
# For test environment
cd terraform/live/test
terragrunt run-all apply

# For production environment
cd terraform/live/prod
terragrunt run-all apply
```

#### Destroying Infrastructure

To destroy resources in reverse order:
```bash
cd terraform/live/dev
terragrunt run-all destroy
```

#### Important Notes:
- Always review the plan before applying changes
- Use workspaces to manage different environments
- Keep sensitive data in AWS Secrets Manager
- Follow the principle of least privilege for IAM roles

#### Common Commands:

1. View execution plan:
```bash
terragrunt plan
```

2. Apply specific module changes:
```bash
cd terraform/live/dev/<module>
terragrunt apply
```

3. View outputs:
```bash
terragrunt output
```

4. Refresh state:
```bash
terragrunt refresh
```

#### Terraform State Management

The state is stored in S3 with the following configuration:
```hcl
terraform {
  backend "s3" {
    bucket         = "gc-signin-dev-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "ca-central-1"
    encrypt        = true
    dynamodb_table = "gc-signin-dev-terraform-locks"
  }
}
```

#### Variables

Environment-specific variables are managed in `terraform/live/<env>/terraform.tfvars`:
```hcl
environment = "dev"
project     = "gc-signin"
region      = "ca-central-1"

vpc_cidr = "10.0.0.0/16"
azs      = ["ca-central-1a", "ca-central-1b"]

container_insights = true
```

