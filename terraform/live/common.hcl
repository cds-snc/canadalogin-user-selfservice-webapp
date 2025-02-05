locals {
  environment = "dev"
  aws_region = "ca-central-1"
  
  # Backend configuration
  backend = {
    container_port = 8000
    task_cpu      = 1024
    task_memory   = 2048
    environment_variables = {
      IBM_VERIFY_TENANT_URL    = "https://gcsignin2.verify.ibm.com/"
      IBM_VERIFY_CLIENT_ID     = "e70df5ae-b5c4-4831-8371-2edbacd4a12c"
      IBM_VERIFY_CLIENT_SECRET = "add secret here"
      IBM_VERIFY_REDIRECT_URI  = "http://localhost:8000"
      CORS_ORIGINS            = "http://localhost:3000,http://gc-signin-frontend-alb-1867250186.ca-central-1.elb.amazonaws.com"
    }
  }

  # Frontend configuration
  frontend = {
    container_port = 3000
    task_cpu      = 1024
    task_memory   = 2048
    environment_variables = {
      NODE_ENV = "production"
      BACKEND_API_URL = "https://gc-signin-backend-alb-1670376413.ca-central-1.elb.amazonaws.com"
    }
  }
} 