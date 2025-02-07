include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "vpc" {
  config_path = "../../shared/vpc"
  mock_outputs = {
    vpc_id = "mock-vpc-id"
    private_subnets = ["mock-subnet-1", "mock-subnet-2"]
  }
  skip_outputs = true
}

dependency "alb" {
  config_path = "../alb"
  mock_outputs = {
    target_group_arn = "arn:aws:elasticloadbalancing:ca-central-1:123456789012:targetgroup/mock-target-group/abcdef123456"
    security_group_id = "sg-mock12345"
  }
  skip_outputs = true
}

dependency "ecr" {
  config_path = "../ecr"
  mock_outputs = {
    repository_url = "mock-repository-url"
  }
  skip_outputs = true
}

dependency "backend_alb" {
  config_path = "../../backend/alb"
  mock_outputs = {
    dns_name = "mock-backend-alb-dns"
  }
  skip_outputs = true
}

terraform {
  source = "../../../../aws/frontend/ecs"
}

dependencies {
  paths = [
    "../../shared/vpc",
    "../alb",
    "../ecr",
    "../../backend/alb"
  ]
}

inputs = {
  product_name = "gc-signin-frontend"

  vpc_id = dependency.vpc.outputs.vpc_id
  private_subnet_ids = dependency.vpc.outputs.private_subnets
  alb_target_group_arn = dependency.alb.outputs.target_group_arn
  alb_security_group_id = dependency.alb.outputs.security_group_id
  target_group_arn = dependency.alb.outputs.target_group_arn
  ecr_repository_url = dependency.ecr.outputs.repository_url
  container_port = 3000
  service_desired_count = 1
  task_cpu = 256
  task_memory = 512
  task_definition_trigger = timestamp()
  env_variables = {
    NODE_ENV = "production"
    BACKEND_API_URL = "http://${dependency.backend_alb.outputs.dns_name}"
  }
} 