terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

# Get default VPC
data "aws_vpc" "default" {
  default = true
}

# Get default subnets
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Get default subnets (public)
data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "map-public-ip-on-launch"
    values = ["true"]
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "video_streaming" {
  name = "video-streaming-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "video-streaming-cluster"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "video_server" {
  name              = "/ecs/video-server"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "nextjs_app" {
  name              = "/ecs/nextjs-app"
  retention_in_days = 7
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role for ECS Task
resource "aws_iam_role" "ecs_task_role" {
  name = "ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "video-streaming-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "video-streaming-alb-sg"
  }
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  name        = "video-streaming-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "video-streaming-ecs-tasks-sg"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "video-streaming-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = data.aws_subnets.public.ids

  enable_deletion_protection = false

  tags = {
    Name = "video-streaming-alb"
  }
}

# Target Group for Video Server
resource "aws_lb_target_group" "video_server" {
  name        = "video-server-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  tags = {
    Name = "video-server-tg"
  }
}

# Target Group for Next.js App
resource "aws_lb_target_group" "nextjs_app" {
  name        = "nextjs-app-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = {
    Name = "nextjs-app-tg"
  }
}

# ALB Listener for Video Server
resource "aws_lb_listener" "video_server" {
  load_balancer_arn = aws_lb.main.arn
  port              = "8080"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.video_server.arn
  }
}

# ALB Listener for Next.js App
resource "aws_lb_listener" "nextjs_app" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.nextjs_app.arn
  }
}

# ECR Repository for Video Server
resource "aws_ecr_repository" "video_server" {
  name                 = "video-server"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "video-server"
  }
}

# ECR Repository for Next.js App
resource "aws_ecr_repository" "nextjs_app" {
  name                 = "nextjs-app"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "nextjs-app"
  }
}

# ECS Task Definition for Video Server
resource "aws_ecs_task_definition" "video_server" {
  family                   = "video-server"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name  = "video-server"
    image = "${aws_ecr_repository.video_server.repository_url}:latest"

    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "PORT"
        value = "8080"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.video_server.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    essential = true
  }])

  tags = {
    Name = "video-server-task"
  }
}

# ECS Task Definition for Next.js App
resource "aws_ecs_task_definition" "nextjs_app" {
  family                   = "nextjs-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name  = "nextjs-app"
    image = "${aws_ecr_repository.nextjs_app.repository_url}:latest"

    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "VIDEO_SERVER_URL"
        value = "http://${aws_lb.main.dns_name}:8080"
      },
      {
        name  = "NEXT_PUBLIC_VIDEO_SERVER_URL"
        value = "http://${aws_lb.main.dns_name}:8080"
      },
      {
        name  = "ADMIN_USERNAME"
        value = var.admin_username
      },
      {
        name  = "ADMIN_PASSWORD"
        value = var.admin_password
      },
      {
        name  = "NEXT_PUBLIC_ADMIN_USERNAME"
        value = var.admin_username
      },
      {
        name  = "NEXT_PUBLIC_ADMIN_PASSWORD"
        value = var.admin_password
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.nextjs_app.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    essential = true
  }])

  tags = {
    Name = "nextjs-app-task"
  }
}

# ECS Service for Video Server
resource "aws_ecs_service" "video_server" {
  name            = "video-server"
  cluster         = aws_ecs_cluster.video_streaming.id
  task_definition = aws_ecs_task_definition.video_server.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.video_server.arn
    container_name   = "video-server"
    container_port   = 8080
  }

  depends_on = [
    aws_lb_listener.video_server
  ]

  tags = {
    Name = "video-server-service"
  }
}

# ECS Service for Next.js App
resource "aws_ecs_service" "nextjs_app" {
  name            = "nextjs-app"
  cluster         = aws_ecs_cluster.video_streaming.id
  task_definition = aws_ecs_task_definition.nextjs_app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.nextjs_app.arn
    container_name   = "nextjs-app"
    container_port   = 3000
  }

  depends_on = [
    aws_lb_listener.nextjs_app,
    aws_ecs_service.video_server
  ]

  tags = {
    Name = "nextjs-app-service"
  }
}
