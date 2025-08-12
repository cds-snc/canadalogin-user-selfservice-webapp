import { OIDC_REDIRECT } from "../utils/constants.jsx";

export const redirectToLogin = () => {
    window.location.href = OIDC_REDIRECT.login;
}

export const redirectToReauth = (pathname) => {
    window.location.href = `${OIDC_REDIRECT.reauth}?returnToPage=${encodeURIComponent(pathname)}`;
}