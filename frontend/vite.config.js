import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    host: "www.manageapp.gcsignin",
    port: 3000,
    allowedHosts: ["www.manageapp.gcsignin"],
    https: true, // This enables HTTPS using the mkcert plugin
  },
});
