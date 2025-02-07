variable "account_id" {
  description = "(Required) The account ID to perform actions on."
  type        = string
}

variable "billing_tag_key" {
  description = "(Optional, default 'CostCentre') Name of the billing tag."
  type        = string
  default     = "CostCentre"
}

variable "billing_tag_value" {
  description = "(Required) the value we use to track billing"
  type        = string
}

variable "billing_code" {
  description = "(Required) Value of the billing tag."
  type        = string
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