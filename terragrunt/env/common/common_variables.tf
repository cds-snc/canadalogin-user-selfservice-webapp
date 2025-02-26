variable "account_id" {
  description = "(Required) The account ID to perform actions on."
  type        = string
}

variable "billing_tag_key" {
  description = "(Optional, default 'CostCentre') Name of the billing tag."
  type        = string
  default     = "CostCentre"
}

variable "env" {
  description = "(Required) The current running environment"
  type        = string
}

variable "region" {
  description = "(Required) The region to build infra in"
  type        = string
}

variable "is_prod_env" {
  description = "Flag to determine if the environment is production."
  type        = number
}

variable "product_name" {
  description = "(Required) The name of the product you are deploying."
  type        = string
}

variable "product_with_env" {
  description = "(Required) the value we use to track billing"
  type        = string
}

variable "root_domain_en" {
  description = "(Required) Root English domain for the environment."
  type        = string
}

variable "root_domain_fr" {
  description = "(Required) Root French domain for the environment."
  type        = string
}

variable "frontend_subdomain_en" {
  description = "(Required) Frontend en subdomain for the environment."
  type        = string
}

variable "backend_subdomain_en" {
  description = "(Required) Backend en subdomain for the environment."
  type        = string
}
