terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "IndiaQuant"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

variable "aws_region" {
  type        = string
  default     = "ap-south-1" # Mumbai - Closest to NSE colocation & broker gateway
  description = "Target AWS Region"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment environment"
}

# 1. S3 Analytical Data Lake Bucket
resource "aws_s3_bucket" "data_lake" {
  bucket        = "india-quant-datalake-${var.environment}-mumbai"
  force_destroy = false
}

resource "aws_s3_bucket_versioning" "data_lake_versioning" {
  bucket = aws_s3_bucket.data_lake.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_lake_encryption" {
  bucket = aws_s3_bucket.data_lake.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 2. VPC for Low-Latency Deployment
resource "aws_vpc" "quant_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "india-quant-vpc"
  }
}

# 3. ECR Repository for Inference Container
resource "aws_ecr_repository" "inference_repo" {
  name                 = "india-quant-inference"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# 4. Secrets Manager for Kite Connect & Database Credentials
resource "aws_secretsmanager_secret" "broker_credentials" {
  name        = "india-quant/broker-credentials"
  description = "Zerodha Kite Connect and upstream API keys"
}
