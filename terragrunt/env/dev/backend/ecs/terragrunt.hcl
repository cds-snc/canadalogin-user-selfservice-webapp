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

dependency "secrets" {
  config_path = "../secrets"
  mock_outputs = {
    secret_arn = "arn:aws:secretsmanager:ca-central-1:123456789012:secret:mock-secret-123456"
  }
  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan", "apply"]
}

dependency "frontend_alb" {
  config_path = "../../frontend/alb"
  mock_outputs = {
    alb_dns_name = "mock-frontend-alb-dns"
  }
  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan", "apply"]
}

terraform {
  source = "../../../../aws/backend/ecs"
}

dependencies {
  paths = [
    "../../shared/vpc",
    "../alb",
    "../ecr",
    "../secrets",
    "../../frontend/alb"
  ]
}

inputs = {
  product_name = "gc-signin-backend"

  vpc_id = dependency.vpc.outputs.vpc_id
  private_subnet_ids = dependency.vpc.outputs.private_subnets
  alb_target_group_arn = dependency.alb.outputs.target_group_arn
  alb_security_group_id = dependency.alb.outputs.alb_security_group_id
  target_group_arn = dependency.alb.outputs.target_group_arn
  ecr_repository_url = dependency.ecr.outputs.repository_url
  container_port = 8000
  service_desired_count = 1
  task_cpu = 256
  task_memory = 512
  task_definition_trigger = timestamp()
  secrets_manager_arn = dependency.secrets.outputs.secret_arn
  env_variables = {
    IBM_VERIFY_TENANT_URL = "https://gcsignin2.verify.ibm.com/"
    IBM_VERIFY_CLIENT_ID = "e70df5ae-b5c4-4831-8371-2edbacd4a12c"
    IBM_VERIFY_REDIRECT_URI = "http://localhost:8000"
    CORS_ORIGINS = "http://${dependency.frontend_alb.outputs.alb_dns_name}"
  }
} 