FROM grafana/k6:0.59.0 AS k6

FROM amazon/aws-cli:2.34.30

# Copy k6 binary from the official image
COPY --from=k6 /usr/bin/k6 /usr/local/bin/k6

# Copy test script and entrypoint
COPY load-test.js /tests/load-test.js
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
