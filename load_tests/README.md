# Load test - Profile Management Application

This load test hooks into the CanadaLogin load test platform. [Learn more here](https://github.com/cds-snc/gc-signin-terraform/tree/main/docs/load-testing)

## Writing load tests

Load tests are written using [K6](https://k6.io/docs/), a JavaScript-based load testing tool. The test script lives in [load-test.js](load-test.js).

Key concepts:

- **Scenarios** define how load is applied (ramp-up, steady state, ramp-down). See [K6 scenarios](https://k6.io/docs/using-k6/scenarios/).
- **Thresholds** define pass/fail criteria (e.g. p95 latency, error rate). See [K6 thresholds](https://k6.io/docs/using-k6/thresholds/).
- **`LOAD_MULTIPLIER`** is an environment variable injected by the platform. Multiply all VU counts and rates by this value so the platform can scale load independently.
- All HTTP requests **must** include the `X-LOAD-TESTING: true` header — the WAF blocks load test traffic without it.
- The `handleSummary` function must output `/tmp/summary.json` and `/tmp/summary.html` for the platform to process results. See the existing implementation for the expected format.

## Deployment

The load test image is built and pushed automatically by the [release pipeline](../.github/workflows/release-pipeline.yml). On **every** workflow run (push to `main` or manual dispatch), the `build-load-test` job:

1. Reads the version from `.deployed_versions/staging.json`
2. Checks out the repo at that SHA
3. Builds the Docker image from `load_tests/`
4. Pushes it to the load test ECR repository with the `:latest` tag

This ensures the load test image always matches the version of the application deployed to staging. No manual steps are required — merging changes to `.deployed_versions/staging.json` will automatically rebuild the load test image for the new version on the next pipeline run.

## Testing locally

You can build and run the load test image locally to verify your changes before merging.

### Build the image

```sh
cd load_tests
docker build -t load-test-local .
```

### Run with a reduced load

Override `LOAD_MULTIPLIER` to keep virtual user counts low. A multiplier of `1` gives the baseline scenario. 0.1 is sufficient for local testing.

```sh
docker run --rm \
  -e LOAD_MULTIPLIER=1 \
  -e APP_NAME=profile-management \
  -e ARTIFACT_BUCKET=unused \
  -e ARTIFACT_PREFIX=unused/ \
  -e RUN_ID=local \
  load-test-local
```

> **Note:** S3 uploads will fail in local mode since there are no AWS credentials — this is expected. The K6 test itself will still run and print results to stdout.

To run K6 directly without Docker (useful for faster iteration):

```sh
# Install k6: https://k6.io/docs/get-started/installation/
LOAD_MULTIPLIER=0.1 k6 run load-test.js
```
