import axios from "axios";

// Double-submit-cookie CSRF handling, built into axios: it reads the
// `csrf_token` cookie and echoes it as `X-CSRF-Token` on every request,
// matching the backend's synchronizer-token check (app/middleware/csrf.py).
axios.defaults.xsrfCookieName = "csrf_token";
axios.defaults.xsrfHeaderName = "X-CSRF-Token";
// The API is on a different origin/subdomain, so this is required -
// axios only does this automatically for same-origin requests otherwise.
axios.defaults.withXSRFToken = true;
