import { useEffect, useCallback } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router";
import { useUser } from "./useUser";
import Loader from "../../components/Layout/Loading";

import { isEmailValid } from "../../utils/functions";
import { useTranslation } from "react-i18next";
import { FLOW_TYPES, OIDC_REDIRECT } from "../../utils/constants";
import { userProfileDispatch } from "../../utils/userProfileDispatch";
import { useNavigateHelper } from "../../hooks/useNavigate";
import type { UserState } from "../../types/user";

interface StepupPrivateRouteProps {
  redirectPath?: string;
}

type RouteGuard = {
  checkPasswordPage: (state: UserState) => boolean;
};

type SignUpGuard = RouteGuard & {
  checkSignUpPage: (state: UserState) => boolean;
  checkVerificationPage: (state: UserState, type?: string | null) => boolean;
  checkVerificationSetUpPage: (state: UserState) => boolean;
  checkCoreProfilePage: (state: UserState) => boolean;
};

function PrivateRoute() {
  const { state } = useUser();
  const { t } = useTranslation("security");
  const { pathname, search } = useLocation();

  const returnToPage = `${pathname}${search}`;
  const isLanguageRootPath = /^\/(en|fr)\/?$/.test(pathname);
  const shouldIncludeReturnToPage = Boolean(search) || !isLanguageRootPath;
  const loginWithReturnToPage = shouldIncludeReturnToPage
    ? `${OIDC_REDIRECT.login}?returnToPage=${encodeURIComponent(returnToPage)}`
    : OIDC_REDIRECT.login;

  useEffect(() => {
    if (!state.isLoading && !state.userProfile) {
      const postLogout = sessionStorage.getItem("post_logout") === "true";
      if (postLogout) {
        sessionStorage.removeItem("post_logout");
        const postLogoutReturnToPage = sessionStorage.getItem(
          "post_logout_return_to_page",
        );
        sessionStorage.removeItem("post_logout_return_to_page");
        // After deliberate logout, force IBM Verify to show the login form
        // instead of silently re-authenticating from a live session.
        // Do not pass returnToPage here; backend logout already stored one-time
        // returnToPage in session and we don't want to overwrite it.
        if (postLogoutReturnToPage) {
          window.location.href = `${OIDC_REDIRECT.login}?returnToPage=${encodeURIComponent(postLogoutReturnToPage)}`;
        } else {
          window.location.href = OIDC_REDIRECT.login;
        }
      } else {
        window.location.href = loginWithReturnToPage;
      }
    }
  }, [loginWithReturnToPage, state.isLoading, state.userProfile]);
  if (state.isLoading) {
    return (
      <Loader
        text={state.loadingText || t("OtpSelection.loading") || "Loading"}
      />
    );
  }
  if (!state.userProfile) {
    return null;
  }

  return <Outlet />;
}

function StepupPrivateRoute({ redirectPath = "" }: StepupPrivateRouteProps) {
  const { state, dispatch } = useUser();
  const { setAuthenticatedPage } = userProfileDispatch(dispatch);
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const navigateHelper = useNavigateHelper();
  const { t } = useTranslation("security");

  const returnToPageKey = "returnToPage";
  const returnToPagePath = searchParams.get(returnToPageKey);
  const isAuthenticatedPage =
    state.authenticatedPages?.includes(pathname) || false;

  const shouldShowContent =
    state.isLoading ||
    !state.userProfile ||
    isAuthenticatedPage ||
    returnToPagePath === pathname;

  const performStepupRedirect = useCallback(() => {
    const redirectUrl = `${OIDC_REDIRECT.reauth}?${returnToPageKey}=${redirectPath ? encodeURIComponent(redirectPath) : encodeURIComponent(pathname)}`;

    window.location.href = redirectUrl;
  }, [pathname, returnToPageKey, redirectPath]);

  const handleAuthenticationSuccess = useCallback(() => {
    console.log(
      "Step-up authentication successful, marking page as authenticated",
    );
    setAuthenticatedPage(pathname);
    navigateHelper(returnToPagePath ?? pathname, true);
  }, [pathname, setAuthenticatedPage, returnToPagePath, navigateHelper]);

  useEffect(() => {
    if (state.isLoading) {
      console.log("Still loading user state...");
      return;
    }

    if (!state.userProfile) {
      console.log("No user profile found");
      return;
    }

    // If page is already authenticated, allow access
    if (isAuthenticatedPage) {
      console.log("Page already authenticated:", pathname);
      return;
    }

    // Check if we're returning from a step-up authentication
    const isReturningFromAuth = returnToPagePath === pathname;

    if (isReturningFromAuth) {
      // User successfully completed step-up auth
      handleAuthenticationSuccess();
    } else {
      // Need to perform step-up authentication
      console.log("Step-up authentication required for:", pathname);
      performStepupRedirect();
    }
  }, [
    state.isLoading,
    state.userProfile,
    pathname,
    returnToPagePath,
    isAuthenticatedPage,
    performStepupRedirect,
    handleAuthenticationSuccess,
  ]);

  // Loading state - this can be a general loading component or spinner in the future
  if (state.isLoading) {
    return <Loader text={state.loadingText || "Loading Profile"} />;
  }

  // Unauthenticated state
  if (!state.userProfile) {
    return null;
  }

  if (!shouldShowContent) {
    // Without this, the password page will appear to the user before we redirect to IDP
    // Loading state - this can be a general loading component or spinner in the future
    return <Loader text={t("OtpSelection.title") || "Loading"} />;
  }

  // Render protected sensitive page
  return <Outlet />;
}

const signUp: SignUpGuard = {
  checkSignUpPage: (state) => {
    return state.userData.viewPrivacy;
  },
  checkVerificationPage: (state, type) => {
    if (type === FLOW_TYPES.email) {
      return (
        signUp.checkSignUpPage(state) &&
        Boolean(isEmailValid(state.userData.email))
      );
    } else {
      return Boolean(
        signUp.checkVerificationSetUpPage(state) &&
        state.userData.stepVerificationSent &&
        state.userData.phone,
      );
    }
  },
  checkPasswordPage: (state) => {
    return (
      signUp.checkVerificationPage(state, "email") &&
      state.userData.emailValidated
    );
  },
  checkVerificationSetUpPage: (state) => {
    return Boolean(
      signUp.checkPasswordPage(state) &&
      state.userData.passwordSubmitted &&
      state.userData.id,
    );
  },
  checkCoreProfilePage: (state) => {
    return (
      signUp.checkVerificationPage(state, null) && state.userData.stepVerified
    );
  },
};

const signIn: RouteGuard & {
  checkLoginValidation: (state: UserState) => boolean;
} = {
  checkPasswordPage: (state) => {
    return Boolean(isEmailValid(state.userData.email));
  },
  checkLoginValidation: (state) => {
    return Boolean(
      signIn.checkPasswordPage(state) &&
      state.userData.passwordValidated &&
      state.userData.phone &&
      state.userData.id,
    );
  },
};

export { PrivateRoute, StepupPrivateRoute };
