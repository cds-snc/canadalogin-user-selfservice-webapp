### Getting started with POSTMAN

Download and Install Postman (https://www.postman.com/downloads)

### Import the POSTMAN collection and environment

In the top left corner there is an import button. Drag both of the
following files into the window (or click choose files and select them):

- [GC_Sign_In_DEV.postman_collection.json](GC_Sign_In_DEV.postman_collection.json)
- [GC_Sign_In_DEV.postman_environment.json](GC_Sign_In_DEV.postman_environment.json)

Select the "GC_Sign_In_DEV" environment in the top-right environment dropdown.

### POSTMAN Environment Variables

All variables used by this collection follow a consistent `UPPER_SNAKE_CASE`
naming convention and live in the `GC_Sign_In_DEV` environment. Most token
variables are auto-populated by test scripts on the relevant requests, so you
only need to set a handful of secrets/config values up front:

1. Set `IBM_VERIFY_TENANT_URL`, `IBM_VERIFY_CLIENT_ID`, `IBM_VERIFY_CLIENT_SECRET`,
   `IBM_VERIFY_API_CLIENT_ID` and `IBM_VERIFY_API_CLIENT_SECRET`.
2. Run `Get a Admin Oauth Token`. Its test script automatically saves the
   response's `access_token` to `ADMIN_ACCESS_TOKEN`.
3. Run `Get Cloud Directory ID` (uses `ADMIN_ACCESS_TOKEN` as its Bearer
   auth). Its test script automatically saves the resulting id to
   `CLOUD_DIRECTORY_ID`, which `SignIn With Password - Return JWT` needs in
   its URL — this must run before step 4.
4. Run `SignIn With Password - Return JWT`. Its test script automatically
   saves the returned JWT/assertion to `ASSERTION_JWT`.
5. In the folder `User Access Token Requests`, run `Get User Access Token`.
   Its test script automatically saves `access_token`/`refresh_token` to
   `USER_ACCESS_TOKEN`/`REFRESH_TOKEN`.
6. (Optional) Run `Authenticated User Profile` — its test script
   automatically saves `USER_ID`, used by a few of the other requests in
   this collection.
