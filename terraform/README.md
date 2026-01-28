# Terraform Configuration for ECS Deployment

This directory contains Terraform configuration for deploying the video streaming platform to AWS ECS Fargate.

## Architecture

- **ECS Cluster**: Fargate launch type (serverless containers)
- **Services**: 
  - `video-server`: Video streaming service (port 8080)
  - `nextjs-app`: Next.js frontend application (port 3000)
- **Load Balancer**: Application Load Balancer (ALB) for public access
- **Container Registry**: Amazon ECR for Docker images
- **Logging**: CloudWatch Logs
- **Networking**: VPC with public subnets

## Quick Start

1. **Copy the environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your AWS profile name and admin credentials**:
   ```bash
   AWS_PROFILE=ccox-mfa
   TF_VAR_admin_username=admin
   TF_VAR_admin_password=password123
   ```

3. **Use the wrapper script** (recommended):
   ```bash
   ./terraform.sh init
   ./terraform.sh plan
   ./terraform.sh apply
   ```

   Or use terraform directly:
   ```bash
   export $(grep -v '^#' .env | xargs)
   terraform init
   terraform plan
   terraform apply
   ```

4. **Build and push Docker images**:
   ```bash
   # From project root
   ./scripts/build-and-push-images.sh
   ```

5. **Get application URLs**:
   ```bash
   terraform output nextjs_app_url
   terraform output video_server_url
   ```

## Environment Variables

The `.env` file supports the following configuration:

- `AWS_PROFILE`: AWS profile name to use for authentication (default: "default")
- `TF_VAR_admin_username`: Admin username for the application (default: "admin")
- `TF_VAR_admin_password`: Admin password for the application (default: "password123")

## Resource Configuration

- **CPU**: 256 (0.25 vCPU) per service
- **Memory**: 512 MB per service
- **Desired Count**: 1 task per service
- **Launch Type**: Fargate (serverless)

## Video Storage

**Important**: By default, videos are stored in the container's filesystem, which is ephemeral. Videos will be lost when containers restart. For production, consider:

1. **Amazon EFS**: Mount EFS volumes to containers for persistent storage
2. **Amazon S3**: Store videos in S3 and stream from there
3. **EBS Volumes**: Not supported with Fargate (use EC2 launch type instead)

## Outputs

After applying, Terraform will output:
- `cluster_name`: ECS cluster name
- `alb_dns_name`: Application Load Balancer DNS name
- `nextjs_app_url`: URL to access the Next.js application
- `video_server_url`: URL to access the video streaming server
- `ecr_video_server_repository_url`: ECR repository URL for video server
- `ecr_nextjs_app_repository_url`: ECR repository URL for Next.js app

## Updating Services

To update a service with a new Docker image:

1. Build and push new images:
   ```bash
   ./scripts/build-and-push-images.sh
   ```

2. Force a new deployment:
   ```bash
   aws ecs update-service \
     --cluster video-streaming-cluster \
     --service video-server \
     --force-new-deployment \
     --profile ccox-mfa
   
   aws ecs update-service \
     --cluster video-streaming-cluster \
     --service nextjs-app \
     --force-new-deployment \
     --profile ccox-mfa
   ```

## Viewing Logs

View container logs in CloudWatch:

```bash
# Video server logs
aws logs tail /ecs/video-server --follow --profile ccox-mfa

# Next.js app logs
aws logs tail /ecs/nextjs-app --follow --profile ccox-mfa
```

## Destroying Resources

To destroy all created resources:

```bash
./terraform.sh destroy
```

Or:

```bash
export $(grep -v '^#' .env | xargs)
terraform destroy
```

**Note**: This will delete all ECR repositories and their images. Make sure you have backups if needed.
