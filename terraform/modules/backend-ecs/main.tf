locals {
  name_prefix = "${var.project}-${var.environment}"
}

resource "aws_ecs_cluster" "backend" {
  name = "${local.name_prefix}-backend-cluster"
  # ... rest of the configuration remains the same
}

# Update other resource names from frontend to backend 