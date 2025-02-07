include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "vpc" {
  config_path = "../../shared/vpc"
  mock_outputs = {
    vpc_id = "mock-vpc-id"
    public_subnets = ["mock-subnet-1", "mock-subnet-2"]
  }
  skip_outputs = true
}

terraform {
  source = "../../../../aws/backend/alb"
}

dependencies {
  paths = ["../../shared/vpc"]
}

inputs = {
  product_name = "gc-signin-backend"
  vpc_id = dependency.vpc.outputs.vpc_id
  public_subnet_ids = dependency.vpc.outputs.public_subnets
  container_port = 8000
} 