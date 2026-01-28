#!/bin/bash

# Terraform wrapper script that loads AWS profile from .env file

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "Loading AWS profile from .env file..."
    # Source the .env file to load AWS_PROFILE
    set -a
    source .env
    set +a
    
    # Export AWS_PROFILE (defaults to "default" if not set)
    if [ -z "$AWS_PROFILE" ]; then
        AWS_PROFILE="default"
    fi
    export AWS_PROFILE
    export TF_VAR_aws_profile="$AWS_PROFILE"
    echo "Using AWS profile: $AWS_PROFILE"
else
    echo "Warning: .env file not found. Using default AWS profile"
    export TF_VAR_aws_profile=""
fi

# Run terraform with all arguments passed to this script
terraform "$@"
