import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

/**
 * Vite config used exclusively by Playwright E2E tests.
 * Runs a plain HTTP server on localhost:3000 — no custom host or TLS certs required.
 * Overrides env vars so API calls target same-origin (localhost:3000), allowing
 * Playwright's page.route() to intercept them without CORS issues.
 */
export default defineConfig({
  plugins: [react(), svgr()],
  define: {
    "import.meta.env.VITE_BACKEND_API_URL": JSON.stringify(
      "http://localhost:3000",
    ),
    "import.meta.env.VITE_ENVIRONMENT": JSON.stringify("dev"),
  },
  server: {
    host: "localhost",
    port: 3000,
    strictPort: true,
  },
});
