resource "aws_secretsmanager_secret" "ibm_verify" {
  name = "${var.product_name}-${var.env}-ibm-verify-secrets"
  description = "IBM Verify secrets for GC Sign In backend"

  tags = {
    Name        = "${var.product_name}-ibm-verify-secrets"
    Environment = var.env
  }
}

resource "aws_secretsmanager_secret_version" "ibm_verify" {
  secret_id = aws_secretsmanager_secret.ibm_verify.id
  secret_string = jsonencode({
    # Secret to be added securely outside of IaC
    IBM_VERIFY_CLIENT_SECRET = var.ibm_verify_client_secret
  })
} 