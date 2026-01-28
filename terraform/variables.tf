variable "aws_profile" {
  description = "AWS profile name to use for authentication"
  type        = string
  default     = "default"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "admin_username" {
  description = "Admin username for the application"
  type        = string
  default     = "admin"
}

variable "admin_password" {
  description = "Admin password for the application"
  type        = string
  default     = "password123"
  sensitive   = true
}
