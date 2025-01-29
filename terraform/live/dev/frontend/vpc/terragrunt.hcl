include "root" {
  path = find_in_parent_folders("terragrunt.hcl")
}

terraform {
  source = "${dirname(find_in_parent_folders())}/../../modules/frontend/vpc"
}

inputs = {
  project     = "gc-signin-frontend"
  environment = "dev"

  vpc_cidr = "10.2.0.0/16"  # Frontend VPC
  private_subnet_cidrs = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
  public_subnet_cidrs = ["10.2.101.0/24", "10.2.102.0/24", "10.2.103.0/24"]
} 