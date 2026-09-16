import { OIDC_REDIRECT } from "./constants";
import type { ApiErrorLike } from "../types/utils";

export const redirectToLogin = (returnToPage?: string): void => {
  const fallbackReturnToPage = `${window.location.pathname}${window.location.search}`;
  const targetReturnToPage = returnToPage ?? fallbackReturnToPage;
  const languageMatch = window.location.pathname.match(/^\/(en|fr)(?:\/|$)/);
  const lang = languageMatch?.[1];
  const loginSearchParams = new URLSearchParams();
  loginSearchParams.set("returnToPage", targetReturnToPage);
  if (lang) {
    loginSearchParams.set("lang", lang);
  }

  window.location.href = `${OIDC_REDIRECT.login}?${loginSearchParams.toString()}`;
};

export const handleApiError = (error: ApiErrorLike): never => {
  if (error.response?.status === 401) {
    redirectToLogin();
  }

  throw error.response ?? error;
};
