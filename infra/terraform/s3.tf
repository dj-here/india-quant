resource "aws_kms_key" "s3_kms" {
  description             = "KMS Key for KidsMentor S3 media encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "kidsmentor-${var.environment}-s3-kms"
  }
}

resource "aws_s3_bucket" "media" {
  bucket        = "kidsmentor-${var.environment}-ephemeral-media"
  force_destroy = false

  tags = {
    Name       = "kidsmentor-${var.environment}-ephemeral-media"
    Compliance = "DPDP-Act-2023-Data-Minimization"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_kms.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket = aws_s3_bucket.media.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 24-Hour Ephemeral Retention Lifecycle (Section 4.B: uploaded content is untrusted and ephemeral)
resource "aws_s3_bucket_lifecycle_configuration" "media_expiry" {
  bucket = aws_s3_bucket.media.id

  rule {
    id     = "ephemeral-homework-and-voice-cleanup"
    status = "Enabled"

    expiration {
      days = 1 # Automatically purge homework photos and raw voice clips within 24 hours
    }

    noncurrent_version_expiration {
      noncurrent_days = 1
    }
  }
}
