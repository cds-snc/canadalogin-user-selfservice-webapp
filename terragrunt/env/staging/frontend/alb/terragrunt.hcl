include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "vpc" {
  config_path = "../../shared/vpc"
  mock_outputs = {
    vpc_id = "vpc-12345678901234567"
    public_subnets = ["subnet-12345678901234567", "subnet-23456789012345678"]
  }
  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan", "apply"]
}

terraform {
  source = "../../../../aws/frontend/alb"
}

dependencies {
  paths = ["../../shared/vpc"]
}

inputs = {
  vpc_id = dependency.vpc.outputs.vpc_id
  public_subnet_ids = dependency.vpc.outputs.public_subnets
  container_port = 3000
} 