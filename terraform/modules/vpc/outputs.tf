output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnet_cidrs" {
  description = "List of private subnet CIDRs"
  value       = var.private_subnet_cidrs
}

output "public_subnet_cidrs" {
  description = "List of public subnet CIDRs"
  value       = var.public_subnet_cidrs
} 