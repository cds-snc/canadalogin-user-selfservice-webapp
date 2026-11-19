import path from "path";
import dotenv from "dotenv";

const E2E_ROOT = path.resolve(__dirname, "..");

// Local runs read e2e/.env; CI sets real environment variables, which take precedence.
dotenv.config({ path: path.join(E2E_ROOT, ".env"), quiet: true });

function optional(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

/** Read lazily so `playwright test --list` works without credentials. */
export function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. See "Environment variables" in e2e/README.md.`,
    );
  }
  return value;
}

const trimSlash = (url: string) => url.replace(/\/+$/, "");

export const env = {
  /** Self-service frontend (where the React app is served). */
  baseURL: trimSlash(optional("E2E_BASE_URL", "http://localhost:3000")),
  /** Self-service backend; must match VITE_BACKEND_API_URL of the frontend under test. */
  apiURL: trimSlash(optional("E2E_API_URL", "http://localhost:8000")),
  ignoreHttpsErrors: optional("E2E_IGNORE_HTTPS_ERRORS", "false") === "true",
  /** Browser timezone; also used to compute expected dates. */
  timezone: optional("E2E_TIMEZONE", "America/Toronto"),
};

export const AUTH_DIR = path.join(E2E_ROOT, ".auth");
