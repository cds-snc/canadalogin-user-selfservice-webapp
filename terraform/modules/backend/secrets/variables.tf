variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "ibm_verify_client_secret" {
  description = "IBM Verify Client Secret"
  type        = string
  sensitive   = true
} 