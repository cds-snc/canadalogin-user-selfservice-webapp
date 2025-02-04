include "root" {
  path = find_in_parent_folders("terragrunt.hcl")
}

include "common" {
  path = find_in_parent_folders("common.hcl")
}

dependency "vpc" {
  config_path = "../../shared/vpc"
}

dependency "alb" {
  config_path = "../alb"
}

dependency "ecr" {
  config_path = "../ecr"
}

dependency "secrets" {
  config_path = "../secrets"
}

terraform {
  source = "${dirname(find_in_parent_folders())}/../../modules/backend/ecs"
}

dependencies {
  paths = [
    "../../shared/vpc",
    "../alb",
    "../ecr",
    "../secrets"
  ]
}

inputs = {
  project     = "gc-signin-backend"
  environment = "dev"
  aws_region  = "ca-central-1"

  vpc_id           = dependency.vpc.outputs.vpc_id
  private_subnet_ids = dependency.vpc.outputs.private_subnets
  alb_security_group_id = dependency.alb.outputs.alb_security_group_id
  target_group_arn = dependency.alb.outputs.target_group_arn
  ecr_repository_url = dependency.ecr.outputs.repository_url
  secrets_manager_arn = dependency.secrets.outputs.secret_arn

  container_port = 8000
  task_cpu = 1024
  task_memory = 2048
  service_desired_count = 1
  task_definition_trigger = timestamp()

  environment_variables = {
    IBM_VERIFY_TENANT_URL    = "https://gcsignin2.verify.ibm.com/"
    IBM_VERIFY_CLIENT_ID     = "e70df5ae-b5c4-4831-8371-2edbacd4a12c"
    IBM_VERIFY_REDIRECT_URI  = "http://localhost:8000"
    CORS_ORIGINS            = "http://localhost:3000,http://gc-signin-frontend-alb-1867250186.ca-central-1.elb.amazonaws.com"
  }
} 