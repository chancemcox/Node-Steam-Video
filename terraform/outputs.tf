output "cluster_name" {
  value = aws_ecs_cluster.video_streaming.name
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "app_url" {
  value = "http://${aws_lb.main.dns_name}"
}

output "nextjs_app_url" {
  value = "http://${aws_lb.main.dns_name}"
}

output "video_server_url" {
  value = "http://${aws_lb.main.dns_name}/api/video"
}

output "ecr_repository_url" {
  value = aws_ecr_repository.app.repository_url
}

output "push_image_command" {
  value = "aws ecr get-login-password --region ${var.aws_region} --profile ${var.aws_profile} | docker login --username AWS --password-stdin ${aws_ecr_repository.app.repository_url}"
}
