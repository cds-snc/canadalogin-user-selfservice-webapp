include "root" {
  path = find_in_parent_folders("terragrunt.hcl")
}

terraform {
  source = "${dirname(find_in_parent_folders())}/../../modules/frontend/ecr"
}

inputs = {
  project     = "gc-signin-frontend"
  environment = "dev"
  aws_region  = "ca-central-1"
} 