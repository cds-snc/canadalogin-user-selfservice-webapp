# Manual Manage App Deployment to AWS

## 1. Environment Setup

- Provision a new AWS environment.
- Configure the required DNS records in AWS Route 53.
- Coordinate with the CL-Platform team to assist with the DNS configuration for a new environment

## 2. Infrastructure Validation

Before deploying the Manage App frontend and backend, verify that the required AWS infrastructure is provisioned and configured.

- Confirm that the frontend and backend AWS infrastructure has been successfully provisioned.
- Verify that the following S3 bucket exists:
  - `app.[aws environment].login-connexion.alpha.canada.ca`
- Access the S3 bucket through the AWS Console and confirm it is available and correctly configured.

## 3. Frontend Deployment

1. Update the frontend `.env` file with the appropriate environment variables.
2. Configure `VITE_BACKEND_API_URL` to point to the DEV2 backend API:

   ```env
   VITE_BACKEND_API_URL=https://api.[aws_environment].login-connexion.alpha.canada.ca
   ```

3. Build the frontend application - `npm i && npm run build`.
4. Sync the generated build artifacts to the DEV2 S3 bucket:

   ```bash
   aws s3 sync frontend/dist s3://app.[aws_environment].login-connexion.alpha.canada.ca
   ```

5. Verify that the frontend assets have been successfully uploaded and that the application is accessible through the configured DEV2 URL.

## 4. Backend Deployment

1. Build the backend Docker image for the target AWS architecture:

   ```bash
   docker buildx build --platform linux/amd64 -t [NAME_OF_ECR].
   ```

2. Follow the AWS ECR commands to authenticate, tag, and push the Docker image to the appropriate repository.
3. Confirm that the new image is available in ECR.
   - Environment variables for the backend are configured via Terraform
4. Manually force a new deployment of the backend ECS service to deploy the updated image.

   **Note:** Ensure the ECS task definition references the intended image tag or digest before triggering deployment.

5. Monitor the ECS deployment and verify that the new tasks start successfully.

## 5. Post-Deployment Validation

- Confirm that the Manage App frontend is accessible.
- Verify that the frontend communicates successfully with the backend API.
- Confirm that the backend ECS service is running and healthy.
- Validate that the application loads without configuration or connectivity errors.
- Perform basic smoke testing to confirm the deployment is successful.
