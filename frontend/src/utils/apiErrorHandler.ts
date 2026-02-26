import { OIDC_REDIRECT } from "./constants";

export const redirectToLogin = (): void => {
  window.location.href = OIDC_REDIRECT.login;
};

export const handleApiError = (error: any): any => {
  if (error?.response?.status === 401) {
    redirectToLogin();
  }
  throw error.response || error;
};
