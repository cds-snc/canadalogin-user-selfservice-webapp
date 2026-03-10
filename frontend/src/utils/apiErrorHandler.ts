import { OIDC_REDIRECT } from "./constants";
import type { ApiErrorLike } from "../types/utils";

export const redirectToLogin = (): void => {
  window.location.href = OIDC_REDIRECT.login;
};

export const handleApiError = (error: ApiErrorLike): never => {
  if (error.response?.status === 401) {
    redirectToLogin();
  }

  throw error.response ?? error;
};
