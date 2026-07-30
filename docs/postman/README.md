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

### IDV Data Store - Token Exchange Flow

This folder mirrors the exact request logic the backend performs in
`idv-data-store`'s `POST /v1/auth/userinfo` delegated-token flow. It talks to
two systems: IBM Verify (for the RFC 8693 token exchange) and idv-data-store
(for the userinfo endpoint).

**Additional environment variables required:**

| Variable                           | Description                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| `IDV_DATA_STORE_BASE_URL`          | Base URL of the idv-data-store instance you're testing against (e.g. `http://localhost:8100`). |
| `IDV_DATA_STORE_CLIENT_ID`         | (Optional) Legacy bootstrap client id for local `/v1/admin/clients` registration tests.        |
| `IDV_DATA_STORE_SCOPES`            | Scope requested during token exchange. For this flow use `idv:auth:userinfo`.                  |
| `IDV_DATA_STORE_STS_CLIENT_ID`     | Client ID of the dedicated IBM Verify STS client used to perform the token exchange.           |
| `IDV_DATA_STORE_STS_CLIENT_SECRET` | Client secret for the STS client above.                                                        |

These map 1:1 to the backend's own `.env` settings of the same name (see
`backend/.env.example`).

**Steps (run in order, after completing steps 1-5 above so `USER_ACCESS_TOKEN` is set):**

1. Run `0. Register IDV Data Store Client (one-time bootstrap)`. This only
   needs to be run once per `IDV_DATA_STORE_CLIENT_ID`/environment **if** you
   also test local bootstrap registration. A `409` response means it's already
   registered, which is safe to ignore.
2. Run `1. Exchange User Token for IDV Data Store (STS)`. Its test script
   automatically saves the response's `access_token` to the
   `IDV_EXCHANGED_ACCESS_TOKEN` environment variable.
3. Run `2. Get Userinfo Claims`. This uses
   `IDV_EXCHANGED_ACCESS_TOKEN` directly as Bearer auth to call
   `/v1/auth/userinfo`.

### IDV Data Store - Token Exchange Flow (standalone collection)

The three requests above also exist as their own, independently importable
collection — useful if you only want to test/share the idv-data-store token
exchange flow without importing the full `GC_Sign_In_DEV` collection:

- Collection: [IDV_Data_Store_Token_Exchange.postman_collection.json](IDV_Data_Store_Token_Exchange.postman_collection.json)
- Environment template: [IDV_Data_Store_Token_Exchange.postman_environment.json](IDV_Data_Store_Token_Exchange.postman_environment.json)

To use it:

1. Import both files into Postman (Import button → drag both files in, or
   select them via the file picker).
2. Select the "IDV Data Store - Token Exchange (template)" environment in
   the top-right environment dropdown.
3. Fill in `IBM_VERIFY_TENANT_URL`, `IDV_DATA_STORE_STS_CLIENT_ID`,
   `IDV_DATA_STORE_STS_CLIENT_SECRET`, and `USER_ACCESS_TOKEN` (obtained the
   same way as step 5 above, e.g. from the `GC_Sign_In_DEV` collection's
   `Get User Access Token` request). `IDV_DATA_STORE_BASE_URL`,
   `IDV_DATA_STORE_CLIENT_ID`, and `IDV_DATA_STORE_SCOPES` already have
   sensible local-dev defaults.
4. Run requests `0` through `2` in order, same as above —
   `IDV_EXCHANGED_ACCESS_TOKEN` is auto-populated by request `1` and then
   reused as Bearer for request `2`.
