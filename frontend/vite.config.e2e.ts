import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

/**
 * Vite config used exclusively by Playwright E2E tests.
 * Runs a plain HTTP server on localhost:3000 — no custom host or TLS certs required.
 */
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    host: "localhost",
    port: 3000,
    strictPort: true,
  },
});
