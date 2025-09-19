import { OIDC_REDIRECT } from "../utils/constants.jsx";

export const redirectToLogin = () => {
  window.location.href = OIDC_REDIRECT.login;
};
