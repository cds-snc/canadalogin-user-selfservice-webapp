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
  vpc_id = dependency.vpc.outputs.vpc_id
  private_subnet_ids = dependency.vpc.outputs.private_subnets
  alb_target_group_arn = dependency.alb.outputs.target_group_arn
  alb_security_group_id = dependency.alb.outputs.alb_security_group_id
  target_group_arn = dependency.alb.outputs.target_group_arn
  ecr_repository_url = dependency.ecr.outputs.repository_url
  container_port = 8000
  service_desired_count = 1
  task_cpu = 1024
  task_memory = 2048
  task_definition_trigger = timestamp()
  secrets_manager_arn = dependency.secrets.outputs.secret_arn
  env_variables = {
    IBM_VERIFY_TENANT_URL = "https://cds-gcsignin-dev.verify.ibm.com"
    IBM_VERIFY_CLIENT_ID = "53a6abe8-b54e-4164-bfbc-6a98760604e3"
    IBM_VERIFY_REDIRECT_URI = "http://localhost:8000"
    # CORS_ORIGINS = "http://${dependency.frontend_alb.outputs.alb_dns_name}" -- At the moment allowing all origins for demo
    IBM_VERIFY_API_CLIENT_ID="bc0a1a0c-667d-4bbb-9f21-ba5b37e56bfa"
    IBM_VERIFY_API_CLIENT_SECRET="LMwElvbwlY"
    PASSWORD_SOURCE_ID="3546b745-8790-4578-b4b5-401390cbc9b4"
  }
} 