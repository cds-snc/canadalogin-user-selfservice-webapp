interface AppConfig {
  apiUrl: string;
  gatag: string;
  environment: string;
  releaseTag: string | undefined;
}

const config: AppConfig = {
  apiUrl: import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8000",
  gatag: import.meta.env.VITE_GOOGLE_ANALYTICS_ID || "G-0Z1YGGZH02",
  environment: import.meta.env.VITE_ENVIRONMENT || "dev",
  releaseTag: import.meta.env.VITE_RELEASE_TAG,
};

export default config;