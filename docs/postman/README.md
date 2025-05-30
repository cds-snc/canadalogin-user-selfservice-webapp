### Getting started with POSTMAN
Download and Install Postman (https://www.postman.com/downloads)

### Import the POSTMAN collection
In the top left corner there is an import button. 
Either drag the [docs/postman/GC_Sign_In_DEV.postman_collection.json](GC_Sign_In_DEV.postman_collection.json) file into the window or click choose files and select it.

### POSTMAN Environment Variables
To get started, set the required environment values. 
On the left hand side, click on environments and set the following secrets

1. Set the tenant `IBM_VERIFY_CLIENT_SECRET` and `IBM_VERIFY_API_CLIENT_SECRET`
2. In Postman Collections, run the `Get a Admin Oauth Token` request
3. From the response, copy the `access_token` value
4. On the left hand side, navigate to environments and set `ADMIN_ACCESS_TOKEN`to the value of `access_token`
5. In Postman Collections, you can now authenticate a user - `SignIn With Password - Return JWT`
6. After you have authenticated a user, you can exchange the returned `assertion` value for a User Access Token
7. In the folder `User Access Token Requests`, run the `Get User Access Token` request. Make sure to update the `assertion` field
8. From the response, copy the `access_token` returned from `Get User Access Token`
9. On the left hand side navigate to environments and set the `User Access Token` variable to the value returned from `access_token`

