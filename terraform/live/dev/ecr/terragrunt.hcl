include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/ecr"
}

inputs = {
  allowed_aws_account_ids = [
    "891377066226"   # Target AWS account ID
  ]
} 