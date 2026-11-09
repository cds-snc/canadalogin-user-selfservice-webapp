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