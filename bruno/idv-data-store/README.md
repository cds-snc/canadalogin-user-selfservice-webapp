# Bruno: IDV Data Store token exchange

This collection demonstrates the self-service flow: exchange a user's IBM
Verify access token, then fetch that user's verified claims from
`GET /v1/users/me/identity-verification/claims`.

## Setup

1. Open this directory as a Bruno collection and select the
   `Development` environment.
2. Set `ibmVerifyTenantUrl` to the IBM Verify tenant base URL and
   `idvDataStoreBaseUrl` to the data-store base URL.
3. In Bruno's environment editor, set the secret variables `stsClientId`,
   `stsClientSecret`, and `subjectToken`. Do not commit credentials or tokens.
4. Confirm the STS client is allowed to issue the `idv:auth:verified-claims`
   scope requested by the environment.
5. Run **Exchange User Token** first, then **Get Current User Claims**. The
   first request stores its returned access token as a runtime variable for
   the second request.

The claims request is user-scoped and uses the exchanged user's delegated
token. It is not the internal client-credentials endpoint, which has a
different authorization model.
