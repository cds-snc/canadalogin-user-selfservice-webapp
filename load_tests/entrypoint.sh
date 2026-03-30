#!/bin/sh

echo "=== Load Test Container Starting ==="
echo "APP_NAME:          ${APP_NAME}"
echo "RUN_ID:            ${RUN_ID}"
echo "LOAD_MULTIPLIER:   ${LOAD_MULTIPLIER}"
echo "ARTIFACT_BUCKET:   ${ARTIFACT_BUCKET}"
echo "ARTIFACT_PREFIX:   ${ARTIFACT_PREFIX}"

k6 run /tests/load-test.js
K6_EXIT=$?

echo "=== K6 run complete (exit code: ${K6_EXIT}) ==="

if [ -f /tmp/summary.json ]; then
  echo "Uploading summary.json to s3://${ARTIFACT_BUCKET}/${ARTIFACT_PREFIX}summary.json"
  aws s3 cp /tmp/summary.json "s3://${ARTIFACT_BUCKET}/${ARTIFACT_PREFIX}summary.json"
else
  echo "WARNING: No summary.json found — K6 may have crashed before producing output"
fi

if [ -f /tmp/summary.html ]; then
  echo "Uploading summary.html to s3://${ARTIFACT_BUCKET}/${ARTIFACT_PREFIX}summary.html"
  aws s3 cp /tmp/summary.html "s3://${ARTIFACT_BUCKET}/${ARTIFACT_PREFIX}summary.html"
else
  echo "WARNING: No summary.html found"
fi

echo "=== Artifacts uploaded successfully ==="

exit ${K6_EXIT}
