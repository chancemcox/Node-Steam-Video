# Deployment Guide

Complete guide for deploying the Video Streaming Platform to AWS ECS.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured with profile `ccox-mfa` (or update `.env` file)
- Terraform installed (>= 1.0)
- Docker installed and running
- Node.js 18+ (for local development)

## Step-by-Step Deployment

### 1. Configure Environment

```bash
cd terraform
cp .env.example .env
```

Edit `.env` file:
```bash
AWS_PROFILE=ccox-mfa
TF_VAR_admin_username=admin
TF_VAR_admin_password=your-secure-password
```

### 2. Verify AWS Credentials

```bash
aws sts get-caller-identity --profile ccox-mfa
```

You should see your AWS account information. If not, configure your AWS profile:

```bash
aws configure --profile ccox-mfa
```

### 3. Initialize Terraform

```bash
cd terraform
./terraform.sh init
```

This will download the AWS provider and initialize the Terraform backend.

### 4. Review Deployment Plan

```bash
./terraform.sh plan
```

Review the planned changes. You should see:
- ECS cluster creation
- ECR repositories creation
- ALB and target groups
- Security groups
- IAM roles
- ECS task definitions and services

### 5. Deploy Infrastructure

```bash
./terraform.sh apply
```

Type `yes` when prompted. This will create all AWS resources.

**Note**: This step may take 5-10 minutes.

### 6. Build and Push Docker Images

From the project root:

```bash
./scripts/build-and-push-images.sh
```

This script will:
1. Authenticate Docker with ECR
2. Build the video-server image
3. Push video-server to ECR
4. Build the nextjs-app image
5. Push nextjs-app to ECR

**Note**: First build may take several minutes. Subsequent builds will be faster due to Docker layer caching.

### 7. Verify Deployment

Check ECS services are running:

```bash
aws ecs describe-services \
  --cluster video-streaming-cluster \
  --services video-server nextjs-app \
  --profile ccox-mfa \
  --query 'services[*].[serviceName,runningCount,desiredCount,status]' \
  --output table
```

### 8. Get Application URLs

```bash
cd terraform
terraform output nextjs_app_url
terraform output video_server_url
```

### 9. Test the Application

1. Open the Next.js app URL in your browser
2. Verify videos are listed (if test video was uploaded)
3. Login with admin credentials
4. Upload a test video
5. Verify video streaming works

## Updating the Application

### Update Docker Images

1. Make changes to your code
2. Rebuild and push images:
   ```bash
   ./scripts/build-and-push-images.sh
   ```
3. Force ECS to deploy new images:
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

### Update Infrastructure

1. Modify Terraform files
2. Review changes:
   ```bash
   cd terraform
   ./terraform.sh plan
   ```
3. Apply changes:
   ```bash
   ./terraform.sh apply
   ```

## Monitoring

### View Logs

```bash
# Video server logs
aws logs tail /ecs/video-server --follow --profile ccox-mfa

# Next.js app logs
aws logs tail /ecs/nextjs-app --follow --profile ccox-mfa
```

### Check Service Health

```bash
# List all tasks
aws ecs list-tasks \
  --cluster video-streaming-cluster \
  --profile ccox-mfa

# Describe a specific task
aws ecs describe-tasks \
  --cluster video-streaming-cluster \
  --tasks <TASK_ARN> \
  --profile ccox-mfa
```

### ALB Target Health

Check target group health in AWS Console:
- Navigate to EC2 → Target Groups
- Select `video-server-tg` or `nextjs-app-tg`
- Check "Health checks" tab

## Scaling

### Scale Services

Update desired count in Terraform:

```hcl
# In terraform/main.tf
resource "aws_ecs_service" "video_server" {
  desired_count = 2  # Change from 1 to 2
  # ...
}
```

Then apply:
```bash
./terraform.sh apply
```

Or use AWS CLI:
```bash
aws ecs update-service \
  --cluster video-streaming-cluster \
  --service video-server \
  --desired-count 2 \
  --profile ccox-mfa
```

### Auto Scaling

For production, consider adding Auto Scaling based on CPU/memory metrics.

## Cleanup

To destroy all resources:

```bash
cd terraform
./terraform.sh destroy
```

**Warning**: This will delete:
- ECS cluster and services
- ECR repositories and all images
- ALB and target groups
- Security groups
- CloudWatch log groups
- IAM roles

Make sure you have backups if needed!

## Cost Optimization

- **Fargate Pricing**: ~$0.04/vCPU-hour + $0.004/GB-hour
- Current setup: 2 services × (0.25 vCPU + 0.5 GB) = ~$0.05/hour = ~$36/month
- **ALB**: ~$0.0225/hour = ~$16/month
- **Data Transfer**: First 100 GB/month free, then $0.09/GB

**Total estimated cost**: ~$50-60/month for minimal usage

To reduce costs:
- Use smaller instance sizes (already at minimum)
- Stop services when not in use
- Use CloudWatch alarms to auto-scale down
- Consider using Spot Fargate (if available in your region)

## Troubleshooting

See [README.md](README.md#troubleshooting) for common issues and solutions.

## Next Steps

- [ ] Add HTTPS/SSL certificate to ALB
- [ ] Implement persistent video storage (EFS or S3)
- [ ] Add CloudWatch alarms and auto-scaling
- [ ] Set up CI/CD pipeline
- [ ] Add monitoring and alerting
- [ ] Implement backup strategy for videos
