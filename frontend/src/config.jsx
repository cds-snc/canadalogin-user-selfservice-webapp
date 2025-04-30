const config = {
    apiUrl: import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000',
    gatag: import.meta.env.VITE_GOOGLE_ANALYTICS_ID
};

export default config;