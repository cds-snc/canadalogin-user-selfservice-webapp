include "root" {
  path = find_in_parent_folders("terragrunt.hcl")
}

include "common" {
  path = find_in_parent_folders("common.hcl")
  expose = true
}

terraform {
  source = "../../../../modules/backend/ecs"
}

dependency "vpc" {
  config_path = "../vpc"

  mock_outputs = {
    vpc_id = "vpc-00000000"
    private_subnets = ["subnet-00000000"]
  }
}

dependency "alb" {
  config_path = "../alb"

  mock_outputs = {
    alb_security_group_id = "sg-00000000"
    target_group_arn = "arn:aws:elasticloadbalancing:region:account:targetgroup/mock/mock"
  }
}

dependency "ecr" {
  config_path = "../ecr"

  mock_outputs = {
    repository_url = "000000000000.dkr.ecr.region.amazonaws.com/gc-signin-backend"
  }
}

inputs = {
  project     = include.common.locals.project
  environment = include.common.locals.environment
  aws_region  = include.common.locals.aws_region

  vpc_id = dependency.vpc.outputs.vpc_id
  private_subnet_ids = dependency.vpc.outputs.private_subnets
  alb_security_group_id = dependency.alb.outputs.alb_security_group_id
  target_group_arn = dependency.alb.outputs.target_group_arn
  ecr_repository_url = dependency.ecr.outputs.repository_url

  container_port = include.common.locals.container_port
  task_cpu = include.common.locals.task_cpu
  task_memory = include.common.locals.task_memory
  service_desired_count = include.common.locals.service_desired_count
  task_definition_trigger = timestamp()
  environment_variables = include.common.locals.environment_variables
} 