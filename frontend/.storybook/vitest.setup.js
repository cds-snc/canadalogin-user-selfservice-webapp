import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { beforeAll } from "vitest";
import { setProjectAnnotations } from "@storybook/react";
import * as projectAnnotations from "./preview";

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
const project = setProjectAnnotations([
  a11yAddonAnnotations,
  projectAnnotations,
]);

beforeAll(() => {
  // Suppress MSW request/response logging in test environment
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    const message = args[0]?.toString() || "";

    // Suppress MSW request/response/handler logs
    if (
      message.includes("Request {") ||
      message.includes("Response {") ||
      message.includes("Handler: HttpHandler {") ||
      message.includes('"method": "GET"') ||
      message.includes('"url": "http://localhost:8000"') ||
      message.includes("session-status") ||
      message.includes("event: notification")
    ) {
      return; // Suppress these MSW logs
    }

    // Allow other console.log messages
    originalConsoleLog.apply(console, args);
  };

  project.beforeAll?.();
});
