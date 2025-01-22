dependency "vpc" {
  config_path = "../dev/vpc"

  mock_outputs = {
    vpc_id = "vpc-00000000"
    private_subnets = ["subnet-00000000"]
    public_subnets = ["subnet-00000000"]
  }
}

dependency "alb" {
  config_path = "../dev/alb"

  mock_outputs = {
    alb_security_group_id = "sg-00000000"
    alb_dns_name = "mock-alb.amazonaws.com"
    target_group_arn = "arn:aws:elasticloadbalancing:region:account:targetgroup/mock/mock"
  }
}

dependency "ecr" {
  config_path = "../dev/ecr"

  mock_outputs = {
    repository_url = "000000000000.dkr.ecr.region.amazonaws.com/gc-signin-backend"
  }
}
