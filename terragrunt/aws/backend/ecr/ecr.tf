resource "aws_ecr_repository" "backend_ecr" {
  name = "${var.product_name}-${var.env}"
  force_delete = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = var.product_name
    Environment = var.env
  }
}

resource "aws_ecr_lifecycle_policy" "backend_ecr_policy" {
  repository = aws_ecr_repository.backend_ecr.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 30 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 30
      }
      action = {
        type = "expire"
      }
    }]
  })
} 