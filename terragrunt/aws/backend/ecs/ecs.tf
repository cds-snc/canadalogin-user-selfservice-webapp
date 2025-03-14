resource "aws_ecs_cluster" "main" {
  name = "${var.product_with_env}-backend-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "${var.product_name}-backend-cluster"
    Environment = var.env
    CostCenter  = var.product_with_env
  }
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.product_with_env}-backend-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Add policy to allow reading from Secrets Manager
resource "aws_iam_role_policy" "ecs_task_secrets_policy" {
  name = "${var.product_with_env}-backend-ecs-task-secrets-policy"
  role = aws_iam_role.ecs_task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [var.secrets_manager_arn]
      }
    ]
  })
}

resource "aws_security_group" "ecs_tasks" {
  name        = "${var.product_with_env}-backend-ecs-tasks-sg"
  description = "Allow inbound traffic from ALB to ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [var.alb_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.product_name}-ecs-tasks-sg"
    Environment = var.env
    CostCenter  = var.product_with_env
  }
}

resource "aws_ecs_task_definition" "main" {
  family                   = "${var.product_with_env}-backend-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name  = "${var.product_with_env}-backend-container"
      image = "${var.ecr_repository_url}:latest"

      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]

      environment = concat(
        [
          {
            name  = "ENVIRONMENT"
            value = var.env
          }
        ],
        [for key, value in var.env_variables : {
          name  = key
          value = value
        } if key != "CLIENT_SECRET"]
      )

      secrets = [
        {
          name      = "IBM_VERIFY_CLIENT_SECRET"
          valueFrom = "${var.secrets_manager_arn}:IBM_VERIFY_CLIENT_SECRET::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.product_with_env}-backend"
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name        = "${var.product_name}-task"
    Environment = var.env
    Trigger     = var.task_definition_trigger
    CostCenter  = var.product_with_env
  }
}

resource "aws_cloudwatch_log_group" "main" {
  name              = "/ecs/${var.product_with_env}-backend"
  retention_in_days = 30

  tags = {
    Name        = "${var.product_name}-logs"
    Environment = var.env
    CostCenter  = var.product_with_env
  }
}

resource "aws_ecs_service" "main" {
  name                              = "${var.product_with_env}-backend-service"
  cluster                           = aws_ecs_cluster.main.id
  task_definition                   = aws_ecs_task_definition.main.arn
  desired_count                     = var.service_desired_count
  launch_type                       = "FARGATE"
  platform_version                  = "LATEST"
  health_check_grace_period_seconds = 60

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = "${var.product_with_env}-backend-container"
    container_port   = var.container_port
  }

  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = {
    Name        = "${var.product_name}-service"
    Environment = var.env
    CostCenter  = var.product_with_env
  }
}
