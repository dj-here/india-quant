variable "aws_region" {
  description = "AWS Region for India DPDP Act 2023 data residency compliance"
  type        = string
  default     = "ap-south-1" # Mumbai
}

variable "environment" {
  description = "Deployment environment (staging, prod)"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for the KidsMentor VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_instance_class" {
  description = "Instance class for RDS PostgreSQL 16"
  type        = string
  default     = "db.t4g.medium"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "kidsmentor"
}

variable "ecs_api_cpu" {
  description = "CPU units for API container"
  type        = number
  default     = 1024
}

variable "ecs_api_memory" {
  description = "Memory (MB) for API container"
  type        = number
  default     = 2048
}

variable "domain_name" {
  description = "Root domain name for KidsMentor"
  type        = string
  default     = "kidsmentor.in"
}
