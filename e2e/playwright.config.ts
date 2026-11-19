import { defineConfig, devices } from "@playwright/test";
import { env } from "./support/env";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  // Tests share a small pool of real test accounts whose IDV state is mutated
  // by the journeys, so run serially until each journey has its own user.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: isCI
    ? [
        ["list"],
        ["github"],
        ["html", { open: "never" }],
        ["junit", { outputFile: "test-results/junit.xml" }],
      ]
    : [["list"], ["html", { open: "never" }]],
  use: {
    // Applies to every project, including setup: the API's load balancer rejects
    // Playwright's default headless user agent ("HeadlessChrome") with a 403.
    ...devices["Desktop Chrome"],
    baseURL: env.baseURL,
    ignoreHTTPSErrors: env.ignoreHttpsErrors,
    locale: "en-CA",
    timezoneId: env.timezone,
    // Traces and videos capture network traffic (session cookies). CI artifacts are
    // downloadable from this public repo, so only keep them for local runs.
    trace: isCI ? "off" : "on-first-retry",
    video: isCI ? "off" : "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      // Sign-in posts the test users' passwords: never record it.
      use: { trace: "off", video: "off", screenshot: "off" },
    },
    {
      name: "idv",
      testMatch: /idv\/.*\.spec\.ts/,
      dependencies: ["setup"],
    },
  ],
});
