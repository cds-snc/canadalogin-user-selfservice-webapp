terraform {
  source = "../../../../aws/shared/gh_oidc"
}

dependencies {
  paths = ["../../frontend/s3"]
}

dependency "s3" {
  config_path = "../../frontend/s3"
  mock_outputs = {
    frontend_client_app_s3_bucket_id = "app.website.com"
  }
  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan", "apply"]
}

inputs = {
  frontend_client_app_s3_bucket_id = dependency.s3.outputs.frontend_client_app_s3_bucket_id
} 



include "root" {
  path = find_in_parent_folders("root.hcl")
}
