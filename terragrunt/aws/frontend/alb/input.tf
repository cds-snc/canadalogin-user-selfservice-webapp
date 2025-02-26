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

variable "certificate_arn" {
  description = "ARN of the SSL certificate"
  type        = string
  default     = null
} 