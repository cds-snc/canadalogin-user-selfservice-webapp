include "root" {
  path = find_in_parent_folders("terragrunt.hcl")
}

dependency "vpc" {
  config_path = "../vpc"
}

terraform {
  source = "${dirname(find_in_parent_folders())}/../../modules/backend/alb"
}

inputs = {
  project     = "gc-signin-backend"
  environment = "dev"
  vpc_id      = dependency.vpc.outputs.vpc_id
  public_subnet_ids = dependency.vpc.outputs.public_subnets
  container_port = 8000
} 