resource "aws_secretsmanager_secret" "api_secrets" {
  name                    = "kidsmentor/${var.environment}/api-secrets"
  recovery_window_in_days = 30

  tags = {
    Name       = "kidsmentor-${var.environment}-secrets"
    Compliance = "DPDP-Act-2023-Key-Management"
  }
}

resource "aws_secretsmanager_secret_version" "api_secrets_val" {
  secret_id = aws_secretsmanager_secret.api_secrets.id

  secret_string = jsonencode({
    ANTHROPIC_API_KEY      = "replace-with-production-anthropic-key"
    ANTHROPIC_BACKUP_KEY   = "replace-with-backup-anthropic-key"
    JWT_SECRET_KEY         = "kidsmentor-production-jwt-secret-do-not-leak"
    DATABASE_URL           = "postgresql+asyncpg://kidsmentor_admin:${random_password.db_password.result}@${aws_db_instance.postgres.endpoint}/${var.db_name}"
    REDIS_URL              = "rediss://${aws_elasticache_replication_group.redis.primary_endpoint_address}:6379/0"
  })
}
