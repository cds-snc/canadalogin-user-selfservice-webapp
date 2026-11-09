## Setup ACT to run Github Actions Locally

### Overview
Act is a tool to execute GitHub Actions workflows locally. Use Act to build your infrastrucutre and to setup swagger for your scratch account.

### Installation Instructions:
- Repo: https://github.com/nektos/act?tab=readme-ov-file
- Homebrew Installation: https://nektosact.com/installation/homebrew.html

### Configuration File
Create a `.actrc` file in your root folder that has the following contents

```
# Set the default platform for runners
-P ubuntu-latest=ghcr.io/catthehacker/ubuntu:act-latest
--container-daemon-socket -
# Pass environment variables directly
--env AWS_ACCESS_KEY_ID=
--env AWS_SECRET_ACCESS_KEY=
--env AWS_SESSION_TOKEN=
--env AWS_REGION=ca-central-1
```

Check that your workflow is specifing your local working branch and not the `main` branch

```
on:
  push:
    branches:
      - YOUR-LOCAL-BRANCH-HERE
```

### AWS CLI
Act is a lightweight simulated runner. If your workflow requires the AWS CLI for tasks like interacting with S3, you need to include the following step in your GitHub Actions workflow:

```
- name: Install AWS CLI
  run: |
    sudo apt-get update
    sudo apt-get install -y awscli
```

### Add Secrets to your workflow
The simulated runner wont be able to use the `aws credentials using OIDC role`. Temporarily replace the OIDC step with the follwing in the workflow you are testing.

```
 - name: AWS Credentials
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_SESSION_TOKEN: ${{ secrets.AWS_SESSION_TOKEN }}
          AWS_REGION: ${{ secrets.AWS_REGION }}
          FRONTEND_APP_S3_BUCKET: ${{ secrets.FRONTEND_APP_S3_BUCKET }}
        run: |
          echo "AWS credentials are set for locally testing the github action."
```



Full example of implementing the aws cli and credentials

```
     - name: Install AWS CLI
        run: |
            sudo apt-get update
            sudo apt-get install -y awscli

      - name: AWS Credentials
        env:
            AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
            AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
            AWS_SESSION_TOKEN: ${{ secrets.AWS_SESSION_TOKEN }}
            AWS_REGION: ${{ secrets.AWS_REGION }}
            FRONTEND_APP_S3_BUCKET: ${{ secrets.FRONTEND_APP_S3_BUCKET }}
        run: |
            echo "AWS credentials are set for locally testing the github action."

```

## Debug Docker daemon 
https://github.com/nektos/act/issues/1051
https://github.com/nektos/act/issues/2239

## Central release pipeline migration

The migration is being done one environment at a time. The central pipeline
currently targets only `dev`; the legacy workflow continues to deploy `test`,
`staging`, and `prod` using the existing `.deployed_versions` pins. It also
continues to build the load-test image while those environments remain on the
legacy pipeline. The central workflow owns release-please and the dev builds.

Keep the central workflow dispatch limited to `dev` until that deployment has
been validated. Before dispatching it, confirm the `dev` GitHub environment has
the Variables and Secrets required by the central pipeline. Do not change
application version pins or force a redeployment for this same-version
handover. Expand the central environment choices and remove each migrated
environment from the legacy workflow in a reviewed follow-up. Keep an
environment out of the central configuration until that cutover, so version
pin changes for environments still on the legacy workflow are not deployed by
both pipelines.

To roll back before migrating another environment, stop central dispatches and
revert the workflow/configuration change. No application version pin needs to
change for that rollback.