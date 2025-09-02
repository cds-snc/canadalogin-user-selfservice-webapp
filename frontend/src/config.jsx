const config = {
    apiUrl: import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000',
    gatag: import.meta.env.VITE_GOOGLE_ANALYTICS_ID || "G-0Z1YGGZH02",
    sessionExpireWarning: import.meta.env.VITE_SESSION_EXPIRE_WARNING || 19.75 * 60 // 5 minutes warning
};

export default config;