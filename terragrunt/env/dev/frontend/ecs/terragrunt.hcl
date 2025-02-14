include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "vpc" {
  config_path = "../../shared/vpc"
  mock_outputs = {
    vpc_id = "vpc-12345678901234567"
    private_subnets = ["subnet-12345678901234567", "subnet-23456789012345678"]
  }
  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan", "apply"]
}

dependency "alb" {
  config_path = "../alb"
  mock_outputs = {
    target_group_arn = "arn:aws:elasticloadbalancing:ca-central-1:123456789012:targetgroup/mock-target-group/abcdef123456"
    alb_security_group_id = "sg-12345678901234567"
  }
  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan", "apply"]
}

dependency "ecr" {
  config_path = "../ecr"
  mock_outputs = {
    repository_url = "mock-repository-url"
  }
  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan", "apply"]
}

dependency "backend_alb" {
  config_path = "../../backend/alb"
  mock_outputs = {
    alb_dns_name = "mock-backend-alb-dns"
  }
  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan", "apply"]
}

terraform {
  source = "../../../../aws/frontend/ecs"
}

dependencies {
  paths = [
    "../../shared/vpc",
    "../alb",
    "../ecr",
    "../../backend/alb"
  ]
}

inputs = {
  product_name = "gc-signin-frontend"

  vpc_id = dependency.vpc.outputs.vpc_id
  private_subnet_ids = dependency.vpc.outputs.private_subnets
  alb_target_group_arn = dependency.alb.outputs.target_group_arn
  alb_security_group_id = dependency.alb.outputs.alb_security_group_id
  target_group_arn = dependency.alb.outputs.target_group_arn
  ecr_repository_url = dependency.ecr.outputs.repository_url
  container_port = 3000
  service_desired_count = 1
  task_cpu = 1024
  task_memory = 2048
  task_definition_trigger = timestamp()
  env_variables = {
    NODE_ENV = "production"
    BACKEND_API_URL = "http://${dependency.backend_alb.outputs.alb_dns_name}"
  }
} 