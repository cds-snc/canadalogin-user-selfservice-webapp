locals {
  common_vars = read_terragrunt_config(find_in_parent_folders())
  project     = "${local.common_vars.locals.project}-backend"
  environment = local.common_vars.locals.environment
  aws_region  = local.common_vars.locals.aws_region
} 