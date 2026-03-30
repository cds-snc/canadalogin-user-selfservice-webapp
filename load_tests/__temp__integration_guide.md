# Adding a New Application to Load Testing

## Step 1: Configure Slack webhook

In the Slack channel you want to receive load test notifications, run:

```
/sre webhooks create
```

Then add the webhook URL to the shared Slack webhooks secret in Secrets Manager (`gc-signin-staging-load-test-slack-webhooks`). The secret is a JSON object keyed by channel name:

```json
{
  "#my-team": "https://sre-bot.cdssandbox.xyz/hook/..."
}
```

This must be done before enabling your load test.

## Step 2: Register your application (disabled)

Add an entry to the `load_tests` list in `terragrunt/env/staging/load_testing/terragrunt.hcl`. Set `enabled = false` so infrastructure is created but load tests won't run yet.

```hcl
inputs = {
  load_tests = [
    # ... existing entries ...
    {
      name            = "my-app"           # Unique identifier, used for resource naming
      display_name    = "My Application"   # Human-readable name for Slack/reports (optional, defaults to name)
      enabled         = false              # Creates infra but skips execution
      load_multiplier = 1                  # VU scaling factor
      slack_channel   = "#my-team"         # Slack channel for notifications
      env_vars        = {}                 # Extra env vars passed to the container
    }
  ]
}
```

Open a PR in [gc-signin-terraform](https://github.com/cds-snc/gc-signin-terraform) with this change. Once merged, CI will apply it and create:

- ECR repository for your load test image
- S3 bucket for test artifacts
- Secrets Manager secret for app-specific config
- ECS task definition

Note the ECR repository URL from the terraform output — you'll need it to push your image.

## Step 3: Build and push your load test image

Build your Docker image following the [image contract](image-contract.md), then push it to the ECR repository created in Step 2. This should be done automatically in your CI/CD pipeline. Note that the load testing system only exists in `staging`. You do not need to push this ECR image to other environments.

**Important:** All HTTP requests in your K6 script must include the `X-LOAD-TESTING: true` header. The WAF allows load test traffic only when this header is present. See the [image contract](image-contract.md#required-header) for details.

Your GitHub Actions workflow will need an IAM role with permission to push to the load test ECR repository. Add a policy that grants `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, and `ecr:CompleteLayerUpload` on the ECR repo ARN. If your application already has a GitHub OIDC role for ECR pushes, you can add the load test ECR repo to its existing policy.

## Step 4: Enable your application

Change `enabled = true` in `terragrunt/env/staging/load_testing/terragrunt.hcl` and open a PR in [gc-signin-terraform](https://github.com/cds-snc/gc-signin-terraform):

```hcl
{
  name            = "my-app"
  display_name    = "My Application"
  enabled         = true
  load_multiplier = 1
  slack_channel   = "#my-team"
  env_vars        = {}
}
```

Once merged, your app will be included in scheduled and manual load test runs.

If the load test runs before an image is pushed, the Slack failure message will indicate that no image was found in ECR.

## Configuration Reference

| Field             | Type        | Required | Default         | Description                                                                            |
| ----------------- | ----------- | -------- | --------------- | -------------------------------------------------------------------------------------- |
| `name`            | string      | yes      | —               | Unique identifier for resource naming. Use lowercase with hyphens.                     |
| `display_name`    | string      | no       | value of `name` | Human-readable name shown in Slack messages and HTML reports.                          |
| `enabled`         | bool        | no       | `true`          | When `false`, infrastructure is created but the app is excluded from load test runs.   |
| `load_multiplier` | number      | yes      | —               | Multiplier for virtual user counts. Set to `1` for baseline, increase for higher load. |
| `slack_channel`   | string      | yes      | —               | Slack channel for notifications. Must have a webhook configured in Secrets Manager.    |
| `env_vars`        | map(string) | yes      | —               | Additional environment variables passed to the container. Use `{}` if none needed.     |
