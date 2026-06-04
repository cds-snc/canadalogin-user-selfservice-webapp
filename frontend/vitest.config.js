import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

const dirname = path.dirname(fileURLToPath(import.meta.url));

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
  plugins: [react(), svgr()],
  preview: {
    port: 3001,
  },
  dev: {
    port: 3000,
  },
  test: {
    projects: [
      {
        plugins: [react(), svgr()],
        test: {
          name: "unit",
          globals: true,
          // Ensure React exports its development/test build which includes `act`.
          // Without this, Test Explorer may not set NODE_ENV and React loads its
          // production bundle where React.act is undefined.
          env: { NODE_ENV: "test" },
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
          css: true,
          environment: "jsdom",
          // Don't fail on unhandled errors from third-party components (GCDS)
          onUnhandledRejection: "ignore",
          dangerouslyIgnoreUnhandledErrors: true,
          // Reduce test output verbosity
          reporter: ["verbose"],
          silent: false,
        },
      },
      {
        plugins: [
          react(),
          svgr(),
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
            // Note: Removed Tests/Manage exclusion to allow setTimeout refactoring tests
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
          setupFiles: [".storybook/vitest.setup.js"],
          // Note: Removed Tests/Manage exclusion to allow setTimeout refactoring tests
          silent: true,
          reporter: ["basic"],
        },
      },
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
  },
});
