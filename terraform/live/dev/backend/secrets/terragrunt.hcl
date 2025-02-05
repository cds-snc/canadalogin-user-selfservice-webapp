include "root" {
  path = find_in_parent_folders("terragrunt.hcl")
}

include "common" {
  path = find_in_parent_folders("common.hcl")
}

terraform {
  source = "${dirname(find_in_parent_folders())}/../../modules/backend/secrets"
}

inputs = {
  project     = "gc-signin-backend"
  environment = "dev"
  ibm_verify_client_secret = "add secret here"  # In production, this should be passed securely
} 