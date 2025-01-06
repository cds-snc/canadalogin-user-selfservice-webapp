include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../../modules/frontend-ecs"
}

dependency "vpc" {
  config_path = "../../../dev/vpc"

  mock_outputs = {
    vpc_id = "vpc-0fea4fd025c960e52"
    private_subnets = ["subnet-0370bbf13d61606c2", "subnet-06ef9ba8bc207ff29", "subnet-06661c9a6eeddd525"]
  }
}

dependency "alb" {
  config_path = "../alb"

  mock_outputs = {
    target_group_arn = "arn:aws:elasticloadbalancing:ca-central-1:891377066226:targetgroup/gc-signin-dev-frontend-tg/6a1c5a71eca9f94b"
    alb_security_group_id = "sg-0efedc91183ec08c8"
  }
}

dependency "ecr" {
  config_path = "../ecr"

  mock_outputs = {
    repository_url = "891377066226.dkr.ecr.ca-central-1.amazonaws.com/gc-signin-frontend-dev"
  }
}

inputs = {
  vpc_id               = dependency.vpc.outputs.vpc_id
  private_subnet_ids   = dependency.vpc.outputs.private_subnets
  alb_security_group_id = dependency.alb.outputs.alb_security_group_id
  target_group_arn     = dependency.alb.outputs.target_group_arn
  ecr_repository_url   = dependency.ecr.outputs.repository_url
  
  container_port       = 3000
  task_cpu            = 1024
  task_memory         = 2048
  service_desired_count = 1
  
  environment_variables = {
    BACKEND_API_URL = "http://gc-signin-dev-alb-1256096961.ca-central-1.elb.amazonaws.com"
  }
}