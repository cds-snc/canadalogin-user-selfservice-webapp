include "root" {
  path = find_in_parent_folders("terragrunt.hcl")
}

include "common" {
  path = find_in_parent_folders("common.hcl")
}

terraform {
  source = "${dirname(find_in_parent_folders())}/../../modules/shared/vpc"
}

inputs = {
  project     = "gc-signin"
  environment = "dev"
  aws_region  = "ca-central-1"

  vpc_cidr = "10.0.0.0/16"
  private_subnet_cidrs = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24"
  ]
  public_subnet_cidrs = [
    "10.0.4.0/24",
    "10.0.5.0/24",
    "10.0.6.0/24"
  ]
} 