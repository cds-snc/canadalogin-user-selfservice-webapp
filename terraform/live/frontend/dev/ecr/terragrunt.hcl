include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../../modules/ecr"
}

locals {
  # Load common variables
  common_vars = read_terragrunt_config(find_in_parent_folders())
  project     = local.common_vars.locals.project
  environment = local.common_vars.locals.environment
  aws_account_id = local.common_vars.locals.aws_account_id
}

inputs = {
  repository_name = "${local.project}-frontend"
  image_tag_mutability = "MUTABLE"
  scan_on_push = true
  force_delete = true
  aws_account_id = local.aws_account_id

  tags = {
    Environment = local.environment
    Project     = local.project
    Application = "frontend"
  }
}