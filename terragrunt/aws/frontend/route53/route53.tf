data "aws_route53_zone" "root_domain_en_zone" {
  name         = var.root_domain_en
  private_zone = false
}

resource "aws_route53_zone" "frontend_subdomain_zone_en" {
  name = var.frontend_subdomain_en

  tags = {
    CostCenter = var.product_with_env
  }
}

resource "aws_route53_record" "frontend_subdomain_ns_record" {
  zone_id = data.aws_route53_zone.root_domain_en_zone.id
  name    = var.frontend_subdomain_en
  type    = "NS"
  ttl     = 300

  records = aws_route53_zone.frontend_subdomain_zone_en.name_servers
}

