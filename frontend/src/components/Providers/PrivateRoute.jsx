import { useEffect, useCallback } from "react";
import { Outlet, useLocation, useSearchParams, useParams } from "react-router";
import { useUser } from "./useUser.tsx";
import Loader from "../../components/Layout/Loading.jsx";

import { isEmailValid, getPageContent } from "../../utils/functions.jsx";
import { FLOW_TYPES, OIDC_REDIRECT, PAGES } from "../../utils/constants.jsx";
import { userProfileDispatch } from "../../utils/userProfileDispatch.jsx";
import { useNavigateHelper } from "../../hooks/useNavigate.tsx";

function PrivateRoute() {
  const { state } = useUser();
  const { language } = useParams();
  const pageContentJson = getPageContent(language, PAGES.otpSelection);

  useEffect(() => {
    if (!state.isLoading && !state.userProfile) {
      window.location.href = OIDC_REDIRECT.login;
    }
  }, [state.isLoading, state.userProfile]);
  if (state.isLoading)
    return <Loader text={state.loadingText || pageContentJson["11"]} />;
  if (!state.userProfile) return null;

  return <Outlet />;
}

function StepupPrivateRoute() {
  const { state, dispatch } = useUser();
  const { setAuthenticatedPage } = userProfileDispatch(dispatch);
  const { pathname } = useLocation();
  const { language } = useParams();
  const [searchParams] = useSearchParams();
  const navigateHelper = useNavigateHelper();
  const pageContentJson = getPageContent(language, PAGES.otpSelection);

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
    const redirectUrl = `${OIDC_REDIRECT.reauth}?${returnToPageKey}=${encodeURIComponent(pathname)}`;
    window.location.href = redirectUrl;
  }, [pathname, returnToPageKey]);

  const handleAuthenticationSuccess = useCallback(() => {
    console.log(
      "Step-up authentication successful, marking page as authenticated",
    );
    setAuthenticatedPage(pathname);
    navigateHelper(returnToPagePath, { replace: true });
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
    return <Loader text={pageContentJson["1"]} />;
  }

  // Render protected sensitive page
  return <Outlet />;
}

const signUp = {
  checkSignUpPage: (state) => {
    return state.userData.viewPrivacy;
  },
  checkVerificationPage: (state, type) => {
    if (type === FLOW_TYPES.email) {
      return (
        signUp.checkSignUpPage(state) && isEmailValid(state.userData.email)
      );
    } else {
      return (
        signUp.checkVerificationSetUpPage(state) &&
        state.userData.stepVerificationSent &&
        state.userData.phone
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
    return (
      signUp.checkPasswordPage(state) &&
      state.userData.passwordSubmitted &&
      state.userData.id
    );
  },
  checkCoreProfilePage: (state) => {
    return (
      signUp.checkVerificationPage(state, null) && state.userData.stepVerified
    );
  },
};

const signIn = {
  checkPasswordPage: (state) => {
    return isEmailValid(state.userData.email);
  },
  checkLoginValidation: (state) => {
    return (
      signIn.checkPasswordPage(state) &&
      state.userData.passwordValidated &&
      state.userData.phone &&
      state.userData.id
    );
  },
};

export { PrivateRoute, StepupPrivateRoute };
