include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/alb"
}

dependency "vpc" {
  config_path = "../vpc"
  
  # Add skip_outputs for initial planning
  skip_outputs = false

  # Add mock outputs for initial planning
  mock_outputs = {
    vpc_id = "vpc-0fea4fd025c960e52"
    public_subnets = ["subnet-0370bbf13d61606c2", "subnet-06ef9ba8bc207ff29", "subnet-06661c9a6eeddd525"]
  }
}

inputs = {
  vpc_id            = dependency.vpc.outputs.vpc_id
  public_subnet_ids = dependency.vpc.outputs.public_subnets
  container_port    = 8000
} 