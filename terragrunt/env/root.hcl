#
# Root Terragrunt config inherited by all modules
# Sets up remote state and common variables and expects env_vars.hcl to be present
# to set an environment's global varialbes.
#
locals {
  product_with_env       = "${local.env_vars.inputs.product_name}-${local.env_vars.inputs.env}"
  env_vars               = read_terragrunt_config(find_in_parent_folders("env_vars.hcl"))
  is_prod_env            = local.env_vars.inputs.env == "prod" ? 1 : 0
  frontend_subdomain_en       = "${local.env_vars.inputs.frontend_subdomain_name}.${local.env_vars.inputs.root_domain_en}"
  backend_subdomain_en       = "${local.env_vars.inputs.backend_subdomain_name}.${local.env_vars.inputs.root_domain_en}"
}

inputs = {
  account_id             = local.env_vars.inputs.account_id
  env                    = local.env_vars.inputs.env
  product_with_env       = "${local.env_vars.inputs.product_name}-${local.env_vars.inputs.env}"
  is_prod_env            = local.is_prod_env
  product_name           = local.env_vars.inputs.product_name
  region                 = local.env_vars.inputs.region
  root_domain_en         = local.env_vars.inputs.root_domain_en
  root_domain_fr         = local.env_vars.inputs.root_domain_fr
  frontend_subdomain_en     = local.frontend_subdomain_en
  backend_subdomain_en      = local.backend_subdomain_en
  
}

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite"
  contents  = file(find_in_parent_folders("common/provider.tf"))
}

generate "common_variables" {
  path      = "common_variables.tf"
  if_exists = "overwrite"
  contents  = file(find_in_parent_folders("common/common_variables.tf"))
}

remote_state {
  backend = "s3"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
  config = {
    encrypt             = true
    bucket              = "${local.env_vars.inputs.product_name}-state-tf-${local.env_vars.inputs.env}-${local.env_vars.inputs.account_id}"
    dynamodb_table      = "terraform-state-lock-dynamo"
    region              = local.env_vars.inputs.region
    key                 = "${path_relative_to_include()}/terraform.tfstate"
    s3_bucket_tags      = { CostCenter : local.product_with_env }
    dynamodb_table_tags = { CostCenter : local.product_with_env }
  }
}