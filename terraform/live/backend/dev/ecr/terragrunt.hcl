include "root" {
  path = find_in_parent_folders("terragrunt.hcl")
}

include "common" {
  path = find_in_parent_folders("common.hcl")
  expose = true
}

terraform {
  source = "../../../../modules/backend/ecr"
}

inputs = {
  project     = include.common.locals.project
  environment = include.common.locals.environment
  aws_region  = include.common.locals.aws_region
} 