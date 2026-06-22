import { OIDC_REDIRECT } from "./constants";
import type { ApiErrorLike } from "../types/utils";

export const redirectToLogin = (returnToPage?: string): void => {
  const fallbackReturnToPage = `${window.location.pathname}${window.location.search}`;
  const targetReturnToPage = returnToPage ?? fallbackReturnToPage;
  window.location.href = `${OIDC_REDIRECT.login}?returnToPage=${encodeURIComponent(targetReturnToPage)}`;
};

export const handleApiError = (error: ApiErrorLike): never => {
  if (error.response?.status === 401) {
    redirectToLogin();
  }

  throw error.response ?? error;
};
