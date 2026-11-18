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
        ["github"],
        ["html", { open: "never" }],
        ["junit", { outputFile: "test-results/junit.xml" }],
      ]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: env.baseURL,
    ignoreHTTPSErrors: env.ignoreHttpsErrors,
    locale: "en-CA",
    timezoneId: env.timezone,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "idv",
      testMatch: /idv\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
});
