# Video Streaming Platform

A full-stack video streaming application with authentication, video upload, and streaming capabilities. Built with Next.js, Node.js, Docker, and deployed on AWS ECS Fargate using Terraform.

## Features

- **Video Streaming**: Stream videos using HTTP range requests for efficient playback
- **Authentication**: Login system using environment variables
- **Video Upload**: Authenticated users can upload new videos
- **Public Viewing**: Non-authenticated users can watch videos
- **Docker Deployment**: Containerized application ready for production
- **AWS ECS**: Infrastructure as code with Terraform (Fargate launch type)

## Architecture

- **Frontend**: Next.js 14 with React and TypeScript
- **Backend**: Node.js/Express video streaming server
- **Infrastructure**: Terraform for AWS ECS (Fargate) provisioning
- **Containerization**: Docker and Docker Compose

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Terraform
- AWS Account with configured credentials
- Docker (for building and pushing images)

## Setup

### 1. Local Development

1. **Clone the repository**
   ```bash
   cd "Node Steam Video"
   ```

2. **Download test video**
   ```bash
   chmod +x scripts/download-test-video.sh
   ./scripts/download-test-video.sh
   ```

3. **Set up environment variables**
   ```bash
   cd nextjs-app
   cp .env.local.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Start with Docker Compose**
   ```bash
   docker-compose up --build
   ```

   Or run individually:
   
   **Video Server:**
   ```bash
   cd video-server
   npm install
   npm start
   ```

   **Next.js App:**
   ```bash
   cd nextjs-app
   npm install
   npm run dev
   ```

### 2. AWS ECS Deployment

1. **Configure AWS Profile**
   ```bash
   cd terraform
   cp .env.example .env
   # Edit .env with your AWS profile name and admin credentials:
   # AWS_PROFILE=ccox-mfa
   # TF_VAR_admin_username=admin
   # TF_VAR_admin_password=password123
   ```

2. **Initialize and apply Terraform**
   
   **Option A: Using the wrapper script (recommended)**
   ```bash
   cd terraform
   ./terraform.sh init
   ./terraform.sh plan
   ./terraform.sh apply
   ```
   
   **Option B: Using terraform directly**
   ```bash
   cd terraform
   export $(grep -v '^#' .env | xargs)
   terraform init
   terraform plan
   terraform apply
   ```

3. **Build and push Docker images to ECR**
   ```bash
   ./scripts/build-and-push-images.sh
   ```
   
   This script will:
   - Build Docker images for both services
   - Push them to ECR repositories
   - ECS will automatically deploy the new images

4. **Access your application**
   ```bash
   # Get the ALB DNS name
   cd terraform
   terraform output nextjs_app_url
   terraform output video_server_url
   ```
   
   The application will be available at:
   - Next.js App: `http://<ALB_DNS_NAME>`
   - Video Server: `http://<ALB_DNS_NAME>:8080`

## Environment Variables

### Next.js App (.env.local)
```
VIDEO_SERVER_URL=http://localhost:8080
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password123
NEXT_PUBLIC_VIDEO_SERVER_URL=http://localhost:8080
```

### Terraform (terraform/.env)
```bash
# AWS Profile Configuration
AWS_PROFILE=ccox-mfa

# Admin credentials for the application
TF_VAR_admin_username=admin
TF_VAR_admin_password=password123
```

**Note**: Make sure your AWS profiles are configured in `~/.aws/credentials` or `~/.aws/config`. The ECS services use Fargate launch type with minimal resources (256 CPU, 512 MB memory).

## Usage

1. **Access the application**
   - Local: http://localhost:3000
   - ECS: Use the URL from `terraform output nextjs_app_url`

2. **Login**
   - Use credentials from `.env.local` file (local) or Terraform variables (ECS)
   - Default: username=`admin`, password=`password123`

3. **Upload videos**
   - Login first (authentication required)
   - Click "Upload New Video"
   - Select an MP4, WebM, or OGG file (max 500MB)
   - Wait for upload to complete

4. **Watch videos**
   - No login required
   - Videos are displayed on the main page
   - Click play to stream
   - Videos stream using HTTP range requests for efficient playback

## API Endpoints

### Video Server

- `GET /api/videos` - List all available videos
- `GET /api/video/:filename` - Stream a specific video
- `POST /api/upload` - Upload a new video (multipart/form-data)
- `GET /health` - Health check

### Next.js App

- `/` - Main page with video list
- Login handled server-side with secure cookies

## ECS Architecture

- **Cluster**: ECS Fargate cluster (serverless containers)
- **Services**: Two ECS services (video-server and nextjs-app)
- **Load Balancer**: Application Load Balancer (ALB) for public access
- **Container Registry**: Amazon ECR for Docker images
- **Logging**: CloudWatch Logs for container logs
- **Networking**: VPC with public subnets for Fargate tasks

### Important: Video Storage

**Current Implementation**: Videos are stored in the container's ephemeral filesystem. This means:
- ✅ Videos work for testing and development
- ⚠️ Videos are lost when containers restart or are replaced
- ⚠️ Not suitable for production without persistent storage

**For Production**: Consider implementing one of these solutions:
1. **Amazon EFS**: Mount EFS volumes to containers for shared, persistent storage
2. **Amazon S3**: Store videos in S3 and stream directly from S3
3. **EBS Volumes**: Not available with Fargate (would require EC2 launch type)

See [terraform/README.md](terraform/README.md#video-storage) for more details.

## Security Notes

- **Change default credentials in production** - Update admin username and password in Terraform variables
- **Use HTTPS in production** - Configure SSL certificate for ALB listener
- **Implement proper authentication tokens** - Add JWT or session tokens for API endpoints
- **Configure AWS Security Groups appropriately** - Restrict access to necessary ports only
- **Add rate limiting** - Implement rate limiting for uploads and API calls
- **Validate file types and sizes server-side** - Already implemented (500MB limit, file type validation)
- **Enable CloudWatch monitoring** - Monitor container logs and metrics
- **Use AWS Secrets Manager** - Store sensitive credentials in AWS Secrets Manager instead of environment variables
- **Enable ECR image scanning** - Already enabled for vulnerability scanning

## Project Structure

```
.
├── terraform/                    # Terraform configuration for AWS ECS
│   ├── main.tf                   # Main infrastructure definitions
│   ├── variables.tf              # Variable definitions
│   ├── outputs.tf                # Output values
│   ├── .env                      # Environment configuration (gitignored)
│   └── terraform.sh              # Wrapper script for Terraform commands
├── video-server/                 # Node.js video streaming server
│   ├── server.js                 # Express server with video streaming
│   ├── Dockerfile                # Docker image definition
│   └── package.json              # Node.js dependencies
├── nextjs-app/                   # Next.js React application
│   ├── app/                      # Next.js app directory
│   │   ├── components/          # React components
│   │   ├── api/                  # API routes
│   │   └── lib/                  # Utility functions
│   ├── Dockerfile                # Docker image definition
│   └── package.json              # Node.js dependencies
├── docker-compose.yml            # Docker Compose for local development
├── scripts/                       # Setup and utility scripts
│   ├── download-test-video.sh    # Download test video file
│   └── build-and-push-images.sh  # Build and push Docker images to ECR
└── README.md                     # This file
```

## Troubleshooting

### Common Issues

- **Videos not loading**: 
  - Check ALB DNS name: `terraform output alb_dns_name`
  - Verify target group health in AWS Console
  - Check CloudWatch logs for errors

- **Upload fails**: 
  - Ensure you're logged in (check authentication cookie)
  - Verify file size is under 500MB
  - Check CloudWatch logs: `aws logs tail /ecs/video-server --follow --profile ccox-mfa`

- **ECS service not starting**: 
  - Check CloudWatch logs for container errors
  - Verify task definition and container image URLs
  - Check security group rules allow traffic from ALB
  - Verify ECR images exist: `aws ecr describe-images --repository-name video-server --profile ccox-mfa`

- **Images not pushing**: 
  - Verify ECR repository URLs: `terraform output ecr_video_server_repository_url`
  - Check AWS credentials: `aws sts get-caller-identity --profile ccox-mfa`
  - Ensure Docker is running: `docker ps`

- **ALB health checks failing**: 
  - Verify containers are listening on correct ports (8080 for video-server, 3000 for nextjs-app)
  - Check health check path: `/health` for video-server, `/` for nextjs-app
  - Review security group rules

### Viewing Logs

```bash
# Video server logs
aws logs tail /ecs/video-server --follow --profile ccox-mfa

# Next.js app logs
aws logs tail /ecs/nextjs-app --follow --profile ccox-mfa
```

### Checking Service Status

```bash
# List running tasks
aws ecs list-tasks --cluster video-streaming-cluster --service-name video-server --profile ccox-mfa

# Describe service
aws ecs describe-services --cluster video-streaming-cluster --services video-server nextjs-app --profile ccox-mfa
```

## Additional Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide with troubleshooting
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide for local and cloud deployment
- **[terraform/README.md](terraform/README.md)** - Terraform-specific documentation

## License

MIT
