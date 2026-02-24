import axios from "axios";

export const X_GC_CLIENT_HEADER_NAME = "X-GC-Client";
export const X_GC_CLIENT_HEADER_VALUE = "canada-login-manage-profile-frontend";

/**
 * Configured axios instance for all API requests.
 *
 * This centralized instance:
 * - Includes credentials for session cookies
 * - Adds a custom header for WAF filtering (X-GC-Client)
 *
 * All API modules should import this instance instead of axios directly.
 */
const axiosInstance = axios.create({
  withCredentials: true,
  headers: {
    [X_GC_CLIENT_HEADER_NAME]: X_GC_CLIENT_HEADER_VALUE,
  },
});

export default axiosInstance;
