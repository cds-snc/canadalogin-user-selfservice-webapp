output "cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.frontend.name
}

output "cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.frontend.arn
}

output "service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.frontend.name
}

output "task_definition_arn" {
  description = "ARN of the task definition"
  value       = aws_ecs_task_definition.frontend.arn
}

output "execution_role_arn" {
  description = "ARN of the ECS execution role"
  value       = aws_iam_role.ecs_execution_role.arn
}

output "task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task_role.arn
} 