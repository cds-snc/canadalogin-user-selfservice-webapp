import { beforeAll } from "vitest";

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
});
