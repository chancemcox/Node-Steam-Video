output "cluster_name" {
  value = aws_ecs_cluster.video_streaming.name
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "nextjs_app_url" {
  value = "http://${aws_lb.main.dns_name}"
}

output "video_server_url" {
  value = "http://${aws_lb.main.dns_name}:8080"
}

output "ecr_video_server_repository_url" {
  value = aws_ecr_repository.video_server.repository_url
}

output "ecr_nextjs_app_repository_url" {
  value = aws_ecr_repository.nextjs_app.repository_url
}

output "push_video_server_image" {
  value = "aws ecr get-login-password --region ${var.aws_region} --profile ${var.aws_profile} | docker login --username AWS --password-stdin ${aws_ecr_repository.video_server.repository_url}"
}

output "push_nextjs_app_image" {
  value = "aws ecr get-login-password --region ${var.aws_region} --profile ${var.aws_profile} | docker login --username AWS --password-stdin ${aws_ecr_repository.nextjs_app.repository_url}"
}
