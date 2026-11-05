resource "aws_wafv2_web_acl" "api_waf" {
  name        = "kidsmentor-${var.environment}-waf"
  description = "WAF for KidsMentor protecting child privacy and preventing abuse"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limiting rule: Max 300 requests per 5 minutes per IP
  rule {
    name     = "RateLimitPerIP"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 300
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KidsMentorRateLimit"
      sampled_requests_enabled   = true
    }
  }

  # Common rule set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KidsMentorCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "KidsMentorWAFWebACL"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "kidsmentor-${var.environment}-waf"
  }
}

resource "aws_wafv2_web_acl_association" "alb_assoc" {
  resource_arn = aws_lb.api.arn
  web_acl_arn  = aws_wafv2_web_acl.api_waf.arn
}
