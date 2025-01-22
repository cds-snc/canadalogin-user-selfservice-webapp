locals {
  root_vars = read_terragrunt_config(find_in_parent_folders())
  project     = "${local.root_vars.inputs.project}-backend"
  environment = local.root_vars.inputs.environment
  aws_region  = local.root_vars.inputs.aws_region

  # Backend specific variables
  container_port = 8000
  task_cpu = 1024
  task_memory = 2048
  service_desired_count = 1
  vpc_cidr = "10.1.0.0/16"
  
  environment_variables = {
    IBM_VERIFY_TENANT_URL    = "https://gcsignin2.verify.ibm.com/"
    IBM_VERIFY_CLIENT_ID     = "e70df5ae-b5c4-4831-8371-2edbacd4a12c"
    IBM_VERIFY_CLIENT_SECRET = "uAVIuisL3e"
    IBM_VERIFY_REDIRECT_URI  = "http://localhost:8000"
    CORS_ORIGINS            = "http://localhost:3000,http://gc-signin-frontend-alb-1867250186.ca-central-1.elb.amazonaws.com"
  }
} 