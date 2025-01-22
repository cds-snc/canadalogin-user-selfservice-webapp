include "root" {
  path = find_in_parent_folders()
}

locals {
  common_vars = read_terragrunt_config(find_in_parent_folders())
  project     = "${local.common_vars.locals.project}-frontend"
  environment = local.common_vars.locals.environment
}

inputs = {
  project     = local.project
  environment = local.environment
  aws_region  = local.common_vars.locals.aws_region

  container_port = 3000
  task_cpu = 1024
  task_memory = 2048
  service_desired_count = 1

  environment_variables = {
    BACKEND_API_URL = "http://backend-alb.internal:8000"
  }
} 