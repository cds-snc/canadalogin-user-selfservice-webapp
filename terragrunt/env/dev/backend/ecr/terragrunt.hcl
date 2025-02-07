include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "../../../../aws/backend/ecr"
}

inputs = {
  product_name = "gc-signin-backend"
} 