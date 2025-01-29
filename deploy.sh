#!/bin/bash

# Exit on error
set -e

# AWS Region
AWS_REGION="ca-central-1"
AWS_ACCOUNT_ID="891377066226"

# Repository names
FRONTEND_REPO="gc-signin-frontend"
BACKEND_REPO="gc-signin-backend"

# ECS service names
FRONTEND_SERVICE="gc-signin-frontend-service"
BACKEND_SERVICE="gc-signin-backend-service"

# ECS cluster names
FRONTEND_CLUSTER="gc-signin-frontend-cluster"
BACKEND_CLUSTER="gc-signin-backend-cluster"

echo "🔑 Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Function to build and push an image
build_and_push() {
    local service=$1
    local dockerfile_path=$2
    local repo_name=$3
    
    echo "🏗️ Building $service image..."
    docker build -t $repo_name:latest $dockerfile_path
    
    echo "🏷️ Tagging $service image..."
    docker tag $repo_name:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$repo_name:latest
    
    echo "⬆️ Pushing $service image..."
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$repo_name:latest
}

# Function to update ECS service
update_ecs_service() {
    local service=$1
    local cluster=$2
    
    echo "🔄 Updating ECS service: $service"
    aws ecs update-service \
        --cluster $cluster \
        --service $service \
        --force-new-deployment \
        --region $AWS_REGION
}

# Build and push frontend
echo "🌐 Processing Frontend..."
build_and_push "Frontend" "./frontend" $FRONTEND_REPO

# Build and push backend
echo "⚙️ Processing Backend..."
build_and_push "Backend" "./backend" $BACKEND_REPO

# Update ECS services
echo "🚀 Updating ECS services..."
update_ecs_service $FRONTEND_SERVICE $FRONTEND_CLUSTER
update_ecs_service $BACKEND_SERVICE $BACKEND_CLUSTER

echo "✅ Deployment completed!"
echo "⏳ Services are being updated. It may take a few minutes for the new containers to be deployed."
echo "You can monitor the deployment status in the AWS ECS console." 
