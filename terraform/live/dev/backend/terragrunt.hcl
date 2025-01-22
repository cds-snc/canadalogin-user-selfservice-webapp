include "root" {
  path = find_in_parent_folders()
}

include "common" {
  path = "common.hcl"
  expose = true
} 