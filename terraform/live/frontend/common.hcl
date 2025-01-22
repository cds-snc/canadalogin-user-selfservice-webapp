locals {
  root_vars = read_terragrunt_config(find_in_parent_folders())
  project     = "${local.root_vars.inputs.project}-frontend"
  environment = local.root_vars.inputs.environment
  aws_region  = local.root_vars.inputs.aws_region

  # Frontend specific variables
  container_port = 3000
  task_cpu = 1024
  task_memory = 2048
  service_desired_count = 1
  vpc_cidr = "10.2.0.0/16"
  
  environment_variables = {
    NODE_ENV = "production"
    BACKEND_API_URL = "https://gc-signin-dev-alb-1099323887.ca-central-1.elb.amazonaws.com"
  }
} 