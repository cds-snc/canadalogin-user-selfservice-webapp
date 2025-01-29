locals {
  common_vars = read_terragrunt_config(find_in_parent_folders("common.hcl"))
  environment = local.common_vars.locals.environment
  aws_region  = local.common_vars.locals.aws_region
  aws_account_id = 891377066226  # Adding explicit account ID

  backend_project  = "gc-signin-backend"
  frontend_project = "gc-signin-frontend"
}

inputs = {
  environment = local.environment
  aws_region  = local.aws_region
  aws_account_id = local.aws_account_id
}

remote_state {
  backend = "s3"
  config = {
    bucket         = "gc-signin-${local.environment}-terraform-state"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = local.aws_region
    encrypt        = true
    dynamodb_table = "gc-signin-${local.environment}-terraform-locks"
  }
}

# Provider configuration
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
provider "aws" {
  region = "${local.aws_region}"
  allowed_account_ids = ["${local.aws_account_id}"]
  
  default_tags {
    tags = {
      Environment = "${local.environment}"
      ManagedBy   = "Terragrunt"
    }
  }
}
EOF
} 