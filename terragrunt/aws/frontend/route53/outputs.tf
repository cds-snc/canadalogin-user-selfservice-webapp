output "frontend_subdomain_en_zone_id" {
  description = "value of the frontend subdomain zone id"
  value       = aws_route53_zone.frontend_subdomain_zone_en.zone_id
}
