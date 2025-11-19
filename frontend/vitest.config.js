import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const filesToInclude = [
  "**/src/App.jsx",
  "**/src/utils/*",
  "**/src/hooks/*",
  "**/src/views/**/*",
  "**/src/components/**/*",
  "**/src/features/**/*",
  "**/src/services/*",
  "**/src/locales/**/*",
];

const filesToExclude = [
  "**/stories/**",
  "**/*.stories.*",
  "**/*.story.*",
  // Note: Removed **/*.test.stories.* exclusion to allow setTimeout refactoring tests
  "**/*.spec.stories.*",
  "**/node_modules/**",
  "**/src/__tests__/testSuite.tsx",
];
export default defineConfig({
  plugins: [react()],
  preview: {
    port: 3001,
  },
  dev: {
    port: 3000,
  },
  test: {
    globals: true,
    setupFiles: ["./src/setup-msw.js", "./src/setupTests.js"],
    include: [
      "src/__tests__/**/*.test.{js,jsx,ts,tsx}",
      "src/__tests__/**/*.spec.{js,jsx,ts,tsx}",
      "src/**/*.test.{js,jsx,ts,tsx}",
      "src/**/*.spec.{js,jsx,ts,tsx}",
      "src/**/__tests__/**/*.{js,jsx,ts,tsx}",
      // Include test story files for setTimeout refactoring
      "src/**/*.test.stories.{js,jsx,ts,tsx}",
    ],
    exclude: [
      ...filesToExclude,
      "**/node_modules/**",
      "**/dist/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
    ],
    coverage: {
      reporter: ["text", "json-summary", "json", "html"],
      reportOnFailure: true,
      all: true,
      enabled: true,
      provider: "istanbul",
      include: [...filesToInclude],
      exclude: [...filesToExclude],
      thresholds: {
        lines: 10,
        branches: 10,
        functions: 10,
        statements: 10,
      },
    },
    css: true,
    environment: "jsdom",
    // Don't fail on unhandled errors from third-party components (GCDS)
    onUnhandledRejection: "ignore",
    dangerouslyIgnoreUnhandledErrors: true,
    // Reduce test output verbosity
    reporter: ["verbose"],
    silent: false,
  },
});
