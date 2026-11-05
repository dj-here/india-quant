resource "aws_db_subnet_group" "db_subnet" {
  name       = "kidsmentor-${var.environment}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name = "kidsmentor-${var.environment}-db-subnet-group"
  }
}

resource "aws_security_group" "db" {
  name        = "kidsmentor-${var.environment}-db-sg"
  description = "Security group for KidsMentor RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS App Tasks"
    from_port       = 5432
    to_port         = 5432
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
    Name = "kidsmentor-${var.environment}-db-sg"
  }
}

resource "aws_kms_key" "db_kms" {
  description             = "KMS Key for KidsMentor RDS encryption at rest"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "kidsmentor-${var.environment}-db-kms"
  }
}

resource "random_password" "db_password" {
  length  = 32
  special = false
}

resource "aws_db_parameter_group" "pgvector_pg" {
  name   = "kidsmentor-${var.environment}-pg16"
  family = "postgres16"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "vector"
  }
}

resource "aws_db_instance" "postgres" {
  identifier             = "kidsmentor-${var.environment}-db"
  allocated_storage      = 50
  max_allocated_storage  = 200
  engine                 = "postgres"
  engine_version         = "16.2"
  instance_class         = var.db_instance_class
  db_name                = var.db_name
  username               = "kidsmentor_admin"
  password               = random_password.db_password.result
  db_subnet_group_name   = aws_db_subnet_group.db_subnet.name
  vpc_security_group_ids = [aws_security_group.db.id]
  parameter_group_name   = aws_db_parameter_group.pgvector_pg.name

  multi_az               = var.environment == "prod" ? true : false
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.db_kms.arn
  publicly_accessible    = false
  skip_final_snapshot    = var.environment == "prod" ? false : true
  final_snapshot_identifier = "kidsmentor-${var.environment}-final-snap"

  backup_retention_period   = 30 # PITR Point in time recovery for 30 days
  backup_window             = "21:00-22:00" # UTC (02:30 IST)
  maintenance_window        = "Sun:22:00-Sun:23:00"
  auto_minor_version_upgrade = true
  deletion_protection       = var.environment == "prod" ? true : false

  tags = {
    Name       = "kidsmentor-${var.environment}-postgres"
    Compliance = "DPDP-Act-2023-Storage-Encrypted"
  }
}
