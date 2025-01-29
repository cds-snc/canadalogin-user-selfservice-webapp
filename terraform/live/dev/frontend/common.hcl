locals {
  root_config = read_terragrunt_config(find_in_parent_folders("terragrunt.hcl"))
  project     = local.root_config.locals.frontend_project
  environment = local.root_config.locals.environment
  aws_region  = local.root_config.locals.aws_region

  # Import frontend-specific variables
  container_port = 3000
  task_cpu = 1024
  task_memory = 2048
  environment_variables = {
    NODE_ENV = "production"
    BACKEND_API_URL = "https://gc-signin-backend-alb-1670376413.ca-central-1.elb.amazonaws.com"
  }
} 