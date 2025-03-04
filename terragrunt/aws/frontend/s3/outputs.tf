output "frontend_client_app_s3_bucket_id" {
  description = "value of the frontend subdomain zone id"
  value       = module.frontend_client_app.s3_bucket_id
}
