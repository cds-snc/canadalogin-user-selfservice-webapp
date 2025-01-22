include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/ecs"
}

dependency "vpc" {
  config_path = "../vpc"
  
  mock_outputs = {
    vpc_id = "vpc-0fea4fd025c960e52"
    private_subnets = ["subnet-0370bbf13d61606c2", "subnet-06ef9ba8bc207ff29", "subnet-06661c9a6eeddd525"]
  }
}

dependency "alb" {
  config_path = "../alb"
  
  mock_outputs = {
    alb_security_group_id = "sg-0c24a82c6f5ebc8c7"
    target_group_arn = "arn:aws:elasticloadbalancing:ca-central-1:891377066226:targetgroup/gc-signin-dev-app-tg/4b69b2a04270490c"
  }
}

dependency "ecr" {
  config_path = "../ecr"
  
  mock_outputs = {
    repository_url = "891377066226.dkr.ecr.ca-central-1.amazonaws.com/gc-signin-dev-app"
  }
}

inputs = {
  vpc_id               = dependency.vpc.outputs.vpc_id
  private_subnet_ids   = dependency.vpc.outputs.private_subnets
  alb_security_group_id = dependency.alb.outputs.alb_security_group_id
  target_group_arn     = dependency.alb.outputs.target_group_arn
  ecr_repository_url   = dependency.ecr.outputs.repository_url
  
  container_port       = 8000
  task_cpu            = 1024
  task_memory         = 2048
  service_desired_count = 1
  
  environment_variables = {
    IBM_VERIFY_TENANT_URL    = "https://gcsignin2.verify.ibm.com/"
    IBM_VERIFY_CLIENT_ID     = "e70df5ae-b5c4-4831-8371-2edbacd4a12c"
    IBM_VERIFY_CLIENT_SECRET = "uAVIuisL3e"
    IBM_VERIFY_REDIRECT_URI  = "http://localhost:8000"
    CORS_ORIGINS            = "http://localhost:3000,http://gc-signin-frontend-alb-1867250186.ca-central-1.elb.amazonaws.com"
  }
} 