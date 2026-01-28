#!/bin/bash

# Deployment script for video streaming platform

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Video Streaming Platform Deployment"
echo "========================================"
echo ""

# Load environment variables
if [ -f .env ]; then
    echo "Loading AWS profile from .env file..."
    set -a
    source .env
    set +a
    
    if [ -z "$AWS_PROFILE" ]; then
        AWS_PROFILE="default"
    fi
    export AWS_PROFILE
    export TF_VAR_aws_profile="$AWS_PROFILE"
    echo "Using AWS profile: $AWS_PROFILE"
else
    echo "Warning: .env file not found. Using default AWS profile"
    export AWS_PROFILE="default"
    export TF_VAR_aws_profile="default"
fi

# Check if key_pair_name is set
if [ -z "$TF_VAR_key_pair_name" ]; then
    echo ""
    echo "⚠️  Key pair name is required for deployment"
    echo "Please set TF_VAR_key_pair_name in .env file or export it:"
    echo ""
    echo "Option 1: Add to .env file:"
    echo "  TF_VAR_key_pair_name=your-key-pair-name"
    echo ""
    echo "Option 2: Export before running:"
    echo "  export TF_VAR_key_pair_name=your-key-pair-name"
    echo ""
    echo "To list available key pairs:"
    echo "  aws ec2 describe-key-pairs --query 'KeyPairs[*].KeyName' --output table"
    echo ""
    read -p "Enter your AWS key pair name: " KEY_PAIR_NAME
    if [ -z "$KEY_PAIR_NAME" ]; then
        echo "Error: Key pair name is required"
        exit 1
    fi
    export TF_VAR_key_pair_name="$KEY_PAIR_NAME"
fi

echo ""
echo "📋 Deployment Plan:"
echo "  - AWS Profile: $AWS_PROFILE"
echo "  - Instance Type: t2.micro"
echo "  - Key Pair: $TF_VAR_key_pair_name"
echo ""

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS credentials not configured or expired"
    echo "Please refresh your AWS SSO token:"
    echo "  aws sso login --profile $AWS_PROFILE"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ Connected to AWS Account: $ACCOUNT_ID"
echo ""

# Initialize Terraform
echo "🔧 Initializing Terraform..."
if ! terraform init; then
    echo "❌ Terraform initialization failed"
    exit 1
fi

echo ""
echo "📊 Planning deployment..."
terraform plan -out=tfplan

echo ""
read -p "Do you want to proceed with deployment? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "🚀 Deploying infrastructure..."
terraform apply tfplan

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Get the EC2 instance IP:"
echo "   terraform output instance_public_ip"
echo ""
echo "2. Copy application files to EC2:"
echo "   scp -r -i your-key.pem ../* ec2-user@<EC2_IP>:~/video-streaming-app"
echo ""
echo "3. SSH into the instance:"
echo "   ssh -i your-key.pem ec2-user@<EC2_IP>"
echo ""
echo "4. Run setup script on EC2:"
echo "   cd ~/video-streaming-app && ./scripts/setup-ec2.sh"
