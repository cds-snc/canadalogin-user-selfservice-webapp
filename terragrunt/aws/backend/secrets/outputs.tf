output "secret_arn" {
  description = "ARN of the secret"
  value       = aws_secretsmanager_secret.ibm_verify.arn
} 