import { OIDC_REDIRECT } from "./constants.jsx";

export const redirectToLogin = () => {
  window.location.href = OIDC_REDIRECT.login;
};

export const handleApiError = (error) => {
  if (error.response?.status === 401) {
    redirectToLogin();
  }
  throw error.response || error;
};
