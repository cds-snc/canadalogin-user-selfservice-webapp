import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "app.auth.signin-connexion.cdssandbox.xyz",
    port: 3000,
    allowedHosts: ["app.auth.signin-connexion.cdssandbox.xyz"],
    https: {
      key: fs.readFileSync(path.resolve("../backend/certs/key.pem")),
      cert: fs.readFileSync(path.resolve("../backend/certs/cert.pem")),
    },
  },
});