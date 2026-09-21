import axios from "axios";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "X-CSRF-Token";
const SAFE_METHODS = new Set(["get", "head", "options"]);

export function getCsrfTokenFromCookie(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

// Echo the server-issued CSRF cookie back as a header on state-changing requests,
// as required by the backend's synchronizer-token CSRF protection.
axios.interceptors.request.use((requestConfig) => {
  const method = requestConfig.method?.toLowerCase();
  if (method && !SAFE_METHODS.has(method)) {
    const token = getCsrfTokenFromCookie();
    if (token) {
      requestConfig.headers.set(CSRF_HEADER_NAME, token);
    }
  }
  return requestConfig;
});
