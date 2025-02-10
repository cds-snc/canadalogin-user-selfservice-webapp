#!/bin/bash

# Exit on error
set -e

# Function to display usage instructions
usage() {
    echo "Usage: $0 <environment> <aws-account-id>"
    echo
    echo "Deploy the application to your AWS sandbox account.  This script must only be run against Sandbox environments!"
    echo
    echo "Arguments:"
    echo "  environment     The environment to deploy to (e.g., sandbox-123456789)"
    echo "  aws-account-id  The AWS account ID where resources are deployed"
    echo
    echo "Example:"
    echo "  $0 sandbox 123456789  # Deploy to sandbox environment in specified AWS account"
    exit 1
}

# Check if both arguments are provided
if [ $# -ne 2 ]; then
    usage
fi

# AWS Region
AWS_REGION="ca-central-1"

# Environment and Account ID from command line
ENV="$1"
AWS_ACCOUNT_ID="$2"

# Validate AWS Account ID format
if ! [[ $AWS_ACCOUNT_ID =~ ^[0-9]{12}$ ]]; then
    echo "Error: Invalid AWS Account ID '$AWS_ACCOUNT_ID'"
    echo "AWS Account ID must be exactly 12 digits"
    exit 1
fi

# Product names from terragrunt
FRONTEND_NAME="gc-signin-frontend"
BACKEND_NAME="gc-signin-backend"

# Repository names (from ECR configuration)
FRONTEND_REPO="${FRONTEND_NAME}-${ENV}"
BACKEND_REPO="${BACKEND_NAME}-${ENV}"

# ECS service names (from ECS configuration)
FRONTEND_SERVICE="${FRONTEND_NAME}-${ENV}-service"
BACKEND_SERVICE="${BACKEND_NAME}-${ENV}-service"

# ECS cluster names (from ECS configuration)
FRONTEND_CLUSTER="${FRONTEND_NAME}-${ENV}-cluster"
BACKEND_CLUSTER="${BACKEND_NAME}-${ENV}-cluster"

# Function to check if ECR repository exists
check_ecr_repo() {
    local repo_name=$1
    aws ecr describe-repositories --repository-names $repo_name --region $AWS_REGION >/dev/null 2>&1 || {
        echo "ECR repository $repo_name does not exist. Please run terragrunt apply first."
        exit 1
    }
}

# Function to check if ECS cluster exists
check_ecs_cluster() {
    local cluster_name=$1
    aws ecs describe-clusters --clusters $cluster_name --region $AWS_REGION | grep -q "ACTIVE" || {
        echo "ECS cluster $cluster_name does not exist or is not active. Please run terragrunt apply first."
        exit 1
    }
}

# Function to check if ECS service exists
check_ecs_service() {
    local service_name=$1
    local cluster_name=$2
    aws ecs describe-services --cluster $cluster_name --services $service_name --region $AWS_REGION | grep -q "ACTIVE" || {
        echo "ECS service $service_name does not exist or is not active. Please run terragrunt apply first."
        exit 1
    }
}

echo "🔍 Checking infrastructure for environment: $ENV in account: $AWS_ACCOUNT_ID..."
check_ecr_repo $FRONTEND_REPO
check_ecr_repo $BACKEND_REPO
check_ecs_cluster $FRONTEND_CLUSTER
check_ecs_cluster $BACKEND_CLUSTER
check_ecs_service $FRONTEND_SERVICE $FRONTEND_CLUSTER
check_ecs_service $BACKEND_SERVICE $BACKEND_CLUSTER

echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Function to build and push an image
build_and_push() {
    local service=$1
    local dockerfile_path=$2
    local repo_name=$3
    
    echo "Building $service image..."
    docker build -t $repo_name:latest $dockerfile_path
    
    echo "Tagging $service image..."
    docker tag $repo_name:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$repo_name:latest
    
    echo "Pushing $service image..."
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$repo_name:latest
}

# Function to update ECS service
update_ecs_service() {
    local service=$1
    local cluster=$2
    
    echo "Updating ECS service: $service"
    aws ecs update-service \
        --cluster $cluster \
        --service $service \
        --force-new-deployment \
        --region $AWS_REGION \
        --no-cli-pager
}

# Build and push frontend
echo "Processing Frontend..."
build_and_push "Frontend" "./frontend" $FRONTEND_REPO

# Build and push backend
echo "Processing Backend..."
build_and_push "Backend" "./backend" $BACKEND_REPO

# Update ECS services
echo "Updating ECS services..."
update_ecs_service $FRONTEND_SERVICE $FRONTEND_CLUSTER
update_ecs_service $BACKEND_SERVICE $BACKEND_CLUSTER

echo "Deployment completed!"
echo "Services are being updated. It may take a few minutes for the new containers to be deployed."
echo "You can monitor the deployment status in the AWS ECS console." 
