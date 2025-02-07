# GC Sign In Infrastructure

This repository contains the Terraform/Terragrunt configuration for deploying the GC Sign In infrastructure on AWS.

## Prerequisites

- [Terraform](https://www.terraform.io/) (>= 1.0)
- [Terragrunt](https://terragrunt.gruntwork.io/) (>= 0.45)
- AWS CLI configured with appropriate credentials
- Docker (for building and pushing container images)

## Project Structure

```
terragrunt/
├── aws/                      
│   ├── backend/
│   │   ├── alb/               # Application Load Balancer 
│   │   ├── ecr/               # Elastic Container Registry 
│   │   ├── ecs/               # Elastic Container Service 
│   │   └── secrets/           # AWS Secrets Manager 
│   ├── frontend/
│   │   ├── alb/               # Application Load Balancer 
│   │   ├── ecr/               # Elastic Container Registry 
│   │   └── ecs/               # Elastic Container Service 
│   └── shared/
│       └── vpc/               # Shared VPC 
└── env/                       # Environment configurations
    ├── common/                # Common configurations (provider, variables)
    └── dev/                   # Development environment
        ├── backend/
        │   ├── alb/          # Backend ALB configuration
        │   ├── ecr/          # Backend ECR configuration
        │   ├── ecs/          # Backend ECS configuration
        │   └── secrets/      # Backend Secrets configuration
        ├── frontend/
        │   ├── alb/          # Frontend ALB configuration
        │   ├── ecr/          # Frontend ECR configuration
        │   └── ecs/          # Frontend ECS configuration
        └── shared/
            └── vpc/          # Shared VPC configuration
```

## Quick Start

These instructions are intended for spinning up the infrastructure using your own AWS scratch account only.
For any other environments, please use Github actions CICD where necessary. 

1. Set up AWS credentials:
```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_SESSION_TOKEN="your-session-token"  # If using temporary credentials
```

2. Deploy the entire infrastructure:
```bash
cd terragrunt/env/dev
terragrunt run-all apply
```

This will:
- Create a shared VPC with public and private subnets (used by both frontend and backend)
- Set up Application Load Balancers for frontend and backend in the shared VPC
- Create ECR repositories for container images
- Store sensitive information in AWS Secrets Manager
- Deploy ECS clusters and services for both frontend and backend in the shared VPC

## Network Architecture

The infrastructure uses a single shared VPC for both frontend and backend services:
- Shared VPC contains both public and private subnets across multiple availability zones
- Application Load Balancers are placed in public subnets
- ECS services run in private subnets
- NAT Gateway provides outbound internet access for private subnets
- All internal communication between frontend and backend happens within the same VPC

## Deployment Order

The infrastructure is deployed in the following order (managed automatically by Terragrunt):

1. Shared VPC (base networking)
2. Secrets Manager (for storing sensitive information)
3. ECR Repositories (for container images)
4. Application Load Balancers (in shared VPC)
5. ECS Services (in shared VPC)

## Environment Variables

The following environment variables are required:

- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_SESSION_TOKEN`: AWS session token (if using temporary credentials)

## Important Notes

- The infrastructure is designed to run in the `ca-central-1` region
- All resources are tagged with `product_name` and `env` tags
- Sensitive information is stored in AWS Secrets Manager
- ECS services run in private subnets with outbound internet access via NAT Gateway
- ALBs are deployed in public subnets
- Both frontend and backend services share the same VPC for optimal network performance, cost savings and security

## Cleanup

To destroy all resources:
```bash
cd terragrunt/env/dev
terragrunt run-all destroy
```

**Note**: This will destroy all resources. Make sure this is what you want to do before proceeding.

## Security Considerations

- All sensitive information is stored in AWS Secrets Manager
- ECS tasks run in private subnets of the shared VPC
- Access to resources is controlled via IAM roles and security groups
- ALBs are the only resources exposed to the internet
- HTTPS is enforced on all ALB listeners
- Internal communication between frontend and backend stays within the VPC 