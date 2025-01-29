include "root" {
  path = find_in_parent_folders("terragrunt.hcl")
}

include "common" {
  path = "../common.hcl"
  expose = true
}

terraform {
  source = "${dirname(find_in_parent_folders())}/../../modules/backend/vpc"
}

inputs = {
  project     = "gc-signin-backend"
  environment = "dev"

  vpc_cidr = "10.1.0.0/16"  # Backend VPC
  private_subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
  public_subnet_cidrs = ["10.1.101.0/24", "10.1.102.0/24", "10.1.103.0/24"]
} 