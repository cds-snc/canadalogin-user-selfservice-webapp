resource "aws_secretsmanager_secret" "ibm_verify" {
  name = "${var.project}-ibm-verify-secrets"
  description = "IBM Verify secrets for GC Sign In backend"

  tags = {
    Name        = "${var.project}-ibm-verify-secrets"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "ibm_verify" {
  secret_id = aws_secretsmanager_secret.ibm_verify.id
  secret_string = jsonencode({
    IBM_VERIFY_CLIENT_SECRET = var.ibm_verify_client_secret
  })
} 