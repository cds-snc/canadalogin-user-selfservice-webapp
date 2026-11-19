import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    host: "local.dev.login-connexion.alpha.canada.ca",
    port: 3000,
    allowedHosts: ["local.dev.login-connexion.alpha.canada.ca"],
    https: {
      key: fs.readFileSync(path.resolve("../backend/certs/key.pem")),
      cert: fs.readFileSync(path.resolve("../backend/certs/cert.pem")),
    },
  },
});
