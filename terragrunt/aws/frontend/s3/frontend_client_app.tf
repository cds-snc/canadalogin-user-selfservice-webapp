module "frontend_client_app" {
  source                  = "github.com/cds-snc/terraform-modules//simple_static_website?ref=v10.3.2"
  domain_name_source      = var.frontend_subdomain_en
  billing_tag_value       = var.product_with_env
  s3_bucket_name          = var.frontend_subdomain_en
  force_destroy_s3_bucket = true
  index_document          = "index.html"
  single_page_app         = true
  hosted_zone_id          = var.frontend_subdomain_en_zone_id
  is_create_hosted_zone   = false

  providers = {
    aws           = aws
    aws.dns       = aws # For scenarios where there is a dedicated DNS provder.
    aws.us-east-1 = aws.us-east-1
  }
}
