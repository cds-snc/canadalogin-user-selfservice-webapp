include "root" {
  path = find_in_parent_folders()
}

include "common" {
  path = "../common.hcl"
  expose = true
}

terraform {
  source = "../../../../modules/vpc"
}

inputs = {
  project     = include.common.locals.project
  environment = include.common.locals.environment

  vpc_cidr = "10.1.0.0/16"  # Backend VPC
  private_subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
  public_subnet_cidrs = ["10.1.101.0/24", "10.1.102.0/24", "10.1.103.0/24"]
} 