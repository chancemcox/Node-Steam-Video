# Quick Start Guide

## Local Development

1. **Download test video** (if not already done):
   ```bash
   ./scripts/download-test-video.sh
   ```

2. **Set up environment variables**:
   ```bash
   cd nextjs-app
   cp .env.local.example .env.local
   # Edit .env.local with your desired credentials
   ```

3. **Start with Docker Compose**:
   ```bash
   docker-compose up --build
   ```

   Access:
   - Next.js App: http://localhost:3000
   - Video Server: http://localhost:8080

4. **Or run individually**:

   Terminal 1 - Video Server:
   ```bash
   cd video-server
   npm install
   npm start
   ```

   Terminal 2 - Next.js App:
   ```bash
   cd nextjs-app
   npm install
   npm run dev
   ```

## Default Login Credentials

- Username: `admin`
- Password: `password123`

(Change these in `.env.local` file)

## AWS ECS Deployment

1. **Configure AWS Profile**:
   ```bash
   cd terraform
   cp .env.example .env
   # Edit .env with your AWS profile name and admin credentials:
   # AWS_PROFILE=ccox-mfa
   # TF_VAR_admin_username=admin
   # TF_VAR_admin_password=password123
   ```

2. **Deploy infrastructure**:
   ```bash
   # Using wrapper script (recommended)
   ./terraform.sh init
   ./terraform.sh plan
   ./terraform.sh apply
   
   # Or using terraform directly
   export $(grep -v '^#' .env | xargs)
   terraform init
   terraform plan
   terraform apply
   ```

3. **Build and push Docker images**:
   ```bash
   # From project root
   ./scripts/build-and-push-images.sh
   ```
   
   This will build and push both Docker images to ECR. ECS will automatically deploy them.

4. **Get application URLs**:
   ```bash
   cd terraform
   terraform output nextjs_app_url
   terraform output video_server_url
   ```

5. **Access your application**:
   - Next.js App: Use the URL from `terraform output nextjs_app_url`
   - Video Server: Use the URL from `terraform output video_server_url`

## Features

- ✅ Video streaming with HTTP range requests
- ✅ User authentication (login/logout)
- ✅ Video upload (authenticated users only)
- ✅ Public video viewing (no login required)
- ✅ Docker containerization
- ✅ Terraform infrastructure as code
- ✅ AWS ECS Fargate deployment
- ✅ Application Load Balancer for public access
- ✅ CloudWatch logging and monitoring

## Important Notes

⚠️ **Video Storage**: Videos are currently stored in ephemeral container storage. They will be lost when containers restart. For production, implement persistent storage (EFS or S3). See [README.md](README.md#ecs-architecture) for details.

## Troubleshooting

- **Port conflicts**: Change ports in `docker-compose.yml`
- **Video not loading**: Check ALB DNS name and target group health
- **Upload fails**: Ensure logged in and file is under 500MB
- **ECS service not starting**: Check CloudWatch logs: `aws logs tail /ecs/video-server --follow --profile ccox-mfa`
- **Images not pushing**: Verify ECR repository URLs and AWS credentials
