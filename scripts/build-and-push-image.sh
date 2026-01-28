#!/bin/bash

# Script to build and push combined Docker image to ECR

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

echo "Building and pushing combined Docker image to ECR..."
echo "AWS Profile: $AWS_PROFILE"
echo "AWS Region: $AWS_REGION"
echo ""

# Get ECR repository URL from Terraform output
cd "$TERRAFORM_DIR"
REPO_URL=$(terraform output -raw ecr_repository_url 2>/dev/null || echo "")

if [ -z "$REPO_URL" ]; then
    echo "Error: ECR repository not found. Please run 'terraform apply' first."
    exit 1
fi

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" --profile "$AWS_PROFILE" | \
    docker login --username AWS --password-stdin "$REPO_URL"

# Build and push combined image for linux/amd64 platform (required for ECS Fargate)
echo ""
echo "Building combined video-streaming-app image for linux/amd64..."
cd "$PROJECT_ROOT"
docker buildx build --platform linux/amd64 -t "$REPO_URL:latest" -f Dockerfile . --push

echo ""
echo "✅ Image pushed successfully!"
echo ""
echo "The ECS service will automatically pull the new image."
echo "You can force a new deployment with:"
echo "  aws ecs update-service --cluster video-streaming-cluster --service video-streaming-app --force-new-deployment --profile $AWS_PROFILE"
