include "root" {
  path = find_in_parent_folders("terragrunt.hcl")
}

include "common" {
  path = find_in_parent_folders("common.hcl")
  expose = true
}

terraform {
  source = "../../../../modules/backend/vpc"
}

inputs = {
  project     = include.common.locals.project
  environment = include.common.locals.environment
  vpc_cidr    = include.common.locals.vpc_cidr
  
  private_subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
  public_subnet_cidrs  = ["10.1.101.0/24", "10.1.102.0/24", "10.1.103.0/24"]
}