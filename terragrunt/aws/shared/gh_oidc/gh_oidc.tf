locals {
  github_action_push_S3 = "github_action_push_S3"
}

#
# Create the OIDC roles used by the GitHub workflows
# The roles can be assumed by the GitHub workflows according to the `claim`
# attribute of each role.
# 
module "github_workflow_roles" {
  source            = "github.com/cds-snc/terraform-modules//gh_oidc_role?ref=64b19ecfc23025718cd687e24b7115777fd09666" # v10.2.1
  billing_tag_value = var.product_with_env
  roles = [
    {
      name      = local.github_action_push_S3
      repo_name = "gc-signin-ibm"
      claim     = "environment:${var.env}"
    }
  ]
}


resource "aws_iam_role_policy_attachment" "github_action_s3_full_access" {
  role       = local.github_action_push_S3
  policy_arn = aws_iam_policy.github_action_allow_all_s3_actions.arn
  depends_on = [module.github_workflow_roles]
}


resource "aws_iam_policy" "github_action_allow_all_s3_actions" {
  name   = local.github_action_push_S3
  policy = data.aws_iam_policy_document.allow_all_s3_actions.json
}


data "aws_iam_policy_document" "allow_all_s3_actions" {

  statement {
    sid     = "AllowAllS3ActionsOnBuckets"
    effect  = "Allow"
    actions = ["s3:*"]
    resources = [
      "arn:aws:s3:::${var.frontend_client_app_s3_bucket_id}",
      "arn:aws:s3:::${var.frontend_client_app_s3_bucket_id}/*"
    ]
  }
}

