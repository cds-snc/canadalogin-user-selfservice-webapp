import { OIDC_REDIRECT } from "./constants";

export const redirectToLogin = (): void => {
  window.location.href = OIDC_REDIRECT.login;
};

interface ApiError extends Error {
  response?: {
    status: number;
    data?: unknown;
  };
}

export const handleApiError = (error: ApiError): never => {
  if (error.response?.status === 401) {
    redirectToLogin();
  }
  throw error.response || error;
};
