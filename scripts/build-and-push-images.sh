#!/bin/bash

# Script to build and push Docker images to ECR

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"

cd "$TERRAFORM_DIR"

# Load environment variables
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

if [ -z "$AWS_PROFILE" ]; then
    AWS_PROFILE="default"
fi

export AWS_PROFILE

# Get AWS region
AWS_REGION=${TF_VAR_aws_region:-us-east-1}

echo "Building and pushing Docker images to ECR..."
echo "AWS Profile: $AWS_PROFILE"
echo "AWS Region: $AWS_REGION"
echo ""

# Get ECR repository URLs from Terraform output
cd "$TERRAFORM_DIR"
VIDEO_SERVER_REPO=$(terraform output -raw ecr_video_server_repository_url 2>/dev/null || echo "")
NEXTJS_APP_REPO=$(terraform output -raw ecr_nextjs_app_repository_url 2>/dev/null || echo "")

if [ -z "$VIDEO_SERVER_REPO" ] || [ -z "$NEXTJS_APP_REPO" ]; then
    echo "Error: ECR repositories not found. Please run 'terraform apply' first."
    exit 1
fi

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" --profile "$AWS_PROFILE" | \
    docker login --username AWS --password-stdin "$VIDEO_SERVER_REPO"

# Build and push Video Server image
echo ""
echo "Building video-server image..."
cd "$PROJECT_ROOT/video-server"
docker build -t video-server:latest .
docker tag video-server:latest "$VIDEO_SERVER_REPO:latest"
echo "Pushing video-server image..."
docker push "$VIDEO_SERVER_REPO:latest"

# Build and push Next.js App image
echo ""
echo "Building nextjs-app image..."
cd "$PROJECT_ROOT/nextjs-app"
docker build -t nextjs-app:latest .
docker tag nextjs-app:latest "$NEXTJS_APP_REPO:latest"
echo "Pushing nextjs-app image..."
docker push "$NEXTJS_APP_REPO:latest"

echo ""
echo "✅ Images pushed successfully!"
echo ""
echo "The ECS services will automatically pull the new images."
echo "You can force a new deployment with:"
echo "  aws ecs update-service --cluster video-streaming-cluster --service video-server --force-new-deployment --profile $AWS_PROFILE"
echo "  aws ecs update-service --cluster video-streaming-cluster --service nextjs-app --force-new-deployment --profile $AWS_PROFILE"
