import { defineConfig, devices } from "@playwright/test";
import { env } from "./support/env";

const isCI = !!process.env.CI;
const authSetupProject = {
  testMatch: /.*\.setup\.ts/,
  // Retrying auth setup would repeat password submissions to the external tenant.
  retries: 0,
  // Sign-in posts the test users' passwords: never record it.
  use: {
    trace: "off" as const,
    video: "off" as const,
    screenshot: "off" as const,
  },
};

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
      name: "setup-proven",
      ...authSetupProject,
      grep: /sign in as proven-user/,
    },
    {
      name: "setup-unproven",
      ...authSetupProject,
      grep: /sign in as unproven-user/,
    },
    {
      name: "setup-in-person",
      ...authSetupProject,
      grep: /sign in as in-person-user/,
    },
    {
      name: "setup-in-person-canada-post",
      ...authSetupProject,
      grep: /sign in as in-person-canada-post-user/,
    },
    {
      name: "idv-service-canada",
      testMatch: /idv\/in-person-journey\.spec\.ts/,
      grep: /Service Canada Centre journey/,
      retries: 0,
      dependencies: ["setup-in-person"],
    },
    {
      name: "idv-canada-post",
      testMatch: /idv\/in-person-journey\.spec\.ts/,
      grep: /Canada Post journey/,
      retries: 0,
      dependencies: ["setup-in-person-canada-post"],
    },
    {
      name: "idv-online-self-photo",
      testMatch: /idv\/online-journey\.spec\.ts/,
      grep: /Self-photo and ID check reaches the confirmation screen/,
      retries: 0,
      dependencies: ["setup-unproven"],
    },
    {
      name: "idv-online-provincial",
      testMatch: /idv\/online-journey\.spec\.ts/,
      grep: /Provincial sign-in displays partner choices/,
      retries: 0,
      dependencies: ["setup-unproven"],
    },
    {
      name: "idv-proven-user",
      testMatch: /idv\/proven-information-card\.spec\.ts/,
      grep: /user with fake ID proofing \(User A\)/,
      dependencies: ["setup-proven"],
    },
    {
      name: "idv-unproven-user",
      testMatch: /idv\/proven-information-card\.spec\.ts/,
      grep: /user without ID proofing \(User B\)/,
      dependencies: ["setup-unproven"],
    },
  ],
});
