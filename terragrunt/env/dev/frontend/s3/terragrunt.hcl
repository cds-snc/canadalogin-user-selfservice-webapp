terraform {
  source = "../../../../aws/frontend/s3"
}


dependencies {
  paths = ["../route53"]
}

dependency "route53" {
  config_path = "../route53"
  mock_outputs = {
    frontend_subdomain_en_zone_id = "s3-12345678901234567"
  }
  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan", "apply"]
}

inputs = {
  frontend_subdomain_en_zone_id = dependency.route53.outputs.frontend_subdomain_en_zone_id
} 

include "root" {
  path = find_in_parent_folders("root.hcl")
}
