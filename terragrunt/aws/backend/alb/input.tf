variable "ibm_verify_client_secret" {
  description = "IBM Verify Client Secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "container_port" {
  description = "Port on which the container is listening"
  type        = number
} 