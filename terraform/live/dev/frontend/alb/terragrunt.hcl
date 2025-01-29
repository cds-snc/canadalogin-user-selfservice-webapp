include "root" {
  path = find_in_parent_folders("terragrunt.hcl")
}

dependency "vpc" {
  config_path = "../vpc"
}

terraform {
  source = "${dirname(find_in_parent_folders())}/../../modules/frontend/alb"
}

inputs = {
  project     = "gc-signin-frontend"
  environment = "dev"
  aws_region  = "ca-central-1"

  vpc_id = dependency.vpc.outputs.vpc_id
  public_subnet_ids = dependency.vpc.outputs.public_subnets
  container_port = 3000
} 