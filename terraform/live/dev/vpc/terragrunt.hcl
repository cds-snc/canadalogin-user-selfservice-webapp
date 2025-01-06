include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/vpc"

  # Add explicit dependency handling
  after_hook "output_debug" {
    commands = ["apply", "plan"]
    execute  = ["echo", "VPC module outputs are available"]
  }
}

inputs = {
  vpc_cidr = "10.0.0.0/16"
  private_subnet_cidrs = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24"
  ]
  public_subnet_cidrs = [
    "10.0.101.0/24",
    "10.0.102.0/24",
    "10.0.103.0/24"
  ]
} 