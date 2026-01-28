# Terraform Configuration for ECS Deployment

This directory contains Terraform configuration for deploying the video streaming platform to AWS ECS Fargate.

## Architecture

- **ECS Cluster**: Fargate launch type (serverless containers)
- **Service**: 
  - `video-streaming-app`: Combined service running both Next.js app (port 3000) and video server (port 8080) in a single container
- **Load Balancer**: Application Load Balancer (ALB) for public access with two target groups
- **Container Registry**: Amazon ECR for Docker images (single repository)
- **Logging**: CloudWatch Logs (`/ecs/video-streaming-app`)
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

4. **Build and push Docker image**:
   ```bash
   # From project root
   ./scripts/build-and-push-image.sh
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

- **CPU**: 512 (0.5 vCPU) per task
- **Memory**: 1024 MB per task
- **Desired Count**: 1 task
- **Launch Type**: Fargate (serverless)
- **Container Ports**: 3000 (Next.js app) and 8080 (video server)

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
- `ecr_repository_url`: ECR repository URL for the combined Docker image

## Updating Service

To update the service with a new Docker image:

1. Build and push new image:
   ```bash
   ./scripts/build-and-push-image.sh
   ```

2. Force a new deployment:
   ```bash
   aws ecs update-service \
     --cluster video-streaming-cluster \
     --service video-streaming-app \
     --force-new-deployment \
     --profile ccox-mfa
   ```

## Viewing Logs

View container logs in CloudWatch:

```bash
# Combined service logs (both Next.js app and video server)
aws logs tail /ecs/video-streaming-app --follow --profile ccox-mfa
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

**Note**: This will delete the ECR repository and all images. Make sure you have backups if needed.
