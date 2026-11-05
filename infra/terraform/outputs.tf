output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}

output "alb_dns_name" {
  description = "DNS name of the application load balancer"
  value       = aws_lb.api.dns_name
}

output "media_bucket_arn" {
  description = "ARN of the ephemeral media S3 bucket"
  value       = aws_s3_bucket.media.arn
}

output "secrets_arn" {
  description = "ARN of Secrets Manager secret"
  value       = aws_secretsmanager_secret.api_secrets.arn
}
