import http from "k6/http";
import { check } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/3.0.4/dist/bundle.js";

const LOAD_MULTIPLIER = parseFloat(__ENV.LOAD_MULTIPLIER || "1");

const TARGET_URL = "https://api.login-connexion.alpha.canada.ca/health/health";

export const options = {
  scenarios: {
    ramp_to_target: {
      executor: "ramping-arrival-rate",
      startRate: 0,
      timeUnit: "1s",
      preAllocatedVUs: 50 * LOAD_MULTIPLIER,
      maxVUs: 300 * LOAD_MULTIPLIER,
      stages: [
        { target: 50 * LOAD_MULTIPLIER, duration: "1m" }, // warmup
        { target: 300 * LOAD_MULTIPLIER, duration: "2m" }, // ramp to target
        { target: 300 * LOAD_MULTIPLIER, duration: "10m" }, // steady state
        { target: 0, duration: "2m" }, // ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<3000"],
    http_req_failed: ["rate<0.1"],
  },
};

export default function () {
  const res = http.get(TARGET_URL, {
    headers: { "X-LOAD-TESTING": "true" },
    tags: { name: "GET /health/health" },
  });
  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 1s": (r) => r.timings.duration < 1000,
  });
}

export function handleSummary(data) {
  const appName = __ENV.DISPLAY_NAME || __ENV.APP_NAME || "Load Test";
  const date = new Date().toISOString().split("T")[0];
  return {
    "/tmp/summary.html": htmlReport(data, { title: `${appName} — ${date}` }),
    "/tmp/summary.json": JSON.stringify(data),
  };
}
