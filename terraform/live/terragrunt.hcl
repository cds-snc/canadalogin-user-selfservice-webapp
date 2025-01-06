locals {
  aws_region = "ca-central-1"
  environment = "dev"
  project = "gc-signin"

  # Get the account ID
  aws_account_id = 891377066226
}

# Generate AWS provider block
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
provider "aws" {
  region = "${local.aws_region}"
  
  default_tags {
    tags = {
      Environment = "${local.environment}"
      Project     = "${local.project}"
      ManagedBy   = "Terragrunt"
    }
  }
}
EOF
}

# Remote state configuration
remote_state {
  backend = "s3"
  config = {
    bucket         = "${local.project}-${local.environment}-terraform-state"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = local.aws_region
    encrypt        = true
    dynamodb_table = "${local.project}-${local.environment}-terraform-locks"
  }
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
}

# Global variables
inputs = {
  aws_region     = local.aws_region
  environment    = local.environment
  project        = local.project
  aws_account_id = local.aws_account_id
} 