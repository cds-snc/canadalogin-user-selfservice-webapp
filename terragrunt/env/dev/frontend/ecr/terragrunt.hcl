include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "../../../../aws/frontend/ecr"
}

inputs = {
  product_name = "gc-signin-frontend"
} 