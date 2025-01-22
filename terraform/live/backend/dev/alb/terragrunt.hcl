include "root" {
  path = find_in_parent_folders("terragrunt.hcl")
}

include "common" {
  path = find_in_parent_folders("common.hcl")
  expose = true
}

terraform {
  source = "../../../../modules/backend/alb"
}

dependency "vpc" {
  config_path = "../vpc"

  # Mock outputs only used during init/plan when VPC doesn't exist yet
  mock_outputs = {
    vpc_id = "vpc-00000000"
    public_subnets = ["subnet-00000000"]
  }
}

inputs = {
  project     = include.common.locals.project
  environment = include.common.locals.environment
  aws_region  = include.common.locals.aws_region

  vpc_id = dependency.vpc.outputs.vpc_id
  public_subnet_ids = dependency.vpc.outputs.public_subnets
  container_port = include.common.locals.container_port
} 