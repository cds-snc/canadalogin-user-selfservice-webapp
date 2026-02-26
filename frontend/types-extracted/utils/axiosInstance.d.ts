export default axiosInstance;
/**
 * Configured axios instance for all API requests.
 *
 * This centralized instance:
 * - Includes credentials for session cookies
 * - Adds a custom header for WAF filtering (X-GC-Client)
 *
 * All API modules should import this instance instead of axios directly.
 */
declare const axiosInstance: import("axios").AxiosInstance;
