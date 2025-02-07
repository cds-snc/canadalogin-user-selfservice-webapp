variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "Security group ID of the ALB"
  type        = string
}

variable "target_group_arn" {
  description = "ARN of the ALB target group"
  type        = string
}

variable "ecr_repository_url" {
  description = "URL of the ECR repository"
  type        = string
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
}

variable "task_cpu" {
  description = "CPU units for the task"
  type        = number
}

variable "task_memory" {
  description = "Memory for the task in MB"
  type        = number
}

variable "service_desired_count" {
  description = "Desired number of tasks in the service"
  type        = number
}

variable "task_definition_trigger" {
  description = "Trigger to force new task definition deployment"
  type        = string
}

variable "env_variables" {
  description = "Environment variables for the container"
  type        = map(string)
} 