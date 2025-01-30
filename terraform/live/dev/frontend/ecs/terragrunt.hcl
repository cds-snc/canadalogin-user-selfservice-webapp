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

terraform {
  source = "${dirname(find_in_parent_folders())}/../../modules/frontend/ecs"
}

dependencies {
  paths = [
    "../../shared/vpc",
    "../alb",
    "../ecr"
  ]
}

inputs = {
  project     = "gc-signin-frontend"
  environment = "dev"
  aws_region  = "ca-central-1"

  vpc_id           = dependency.vpc.outputs.vpc_id
  private_subnet_ids = dependency.vpc.outputs.private_subnets
  alb_security_group_id = dependency.alb.outputs.alb_security_group_id
  target_group_arn = dependency.alb.outputs.target_group_arn
  ecr_repository_url = dependency.ecr.outputs.repository_url

  container_port = 3000
  task_cpu = 1024
  task_memory = 2048
  service_desired_count = 1
  task_definition_trigger = timestamp()

  environment_variables = {
    NODE_ENV = "production"
    BACKEND_API_URL = "https://gc-signin-backend-alb-1670376413.ca-central-1.elb.amazonaws.com"
  }
} 