include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "../../../../aws/shared/vpc"
}

inputs = {
  product_name = "gc-signin"

  vpc_cidr = "10.0.0.0/16"
  private_subnet_cidrs = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24"
  ]
  public_subnet_cidrs = [
    "10.0.4.0/24",
    "10.0.5.0/24",
    "10.0.6.0/24"
  ]
} 