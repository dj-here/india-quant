resource "aws_elasticache_subnet_group" "redis" {
  name       = "kidsmentor-${var.environment}-redis-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "kidsmentor-${var.environment}-redis-subnet"
  }
}

resource "aws_security_group" "redis" {
  name        = "kidsmentor-${var.environment}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Redis from ECS tasks"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "kidsmentor-${var.environment}-redis-sg"
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "kidsmentor-${var.environment}-cache"
  description                = "Redis cluster for KidsMentor session caching and rate limits"
  node_type                  = "cache.t4g.micro"
  port                       = 6379
  parameter_group_name       = "default.redis7"
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = var.environment == "prod" ? true : false
  num_cache_clusters         = var.environment == "prod" ? 2 : 1
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = {
    Name = "kidsmentor-${var.environment}-redis"
  }
}
