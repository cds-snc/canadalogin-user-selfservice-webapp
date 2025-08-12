import { useEffect } from "react";
import { Outlet, useParams, useLocation, useSearchParams } from "react-router";
import { useUser } from "./useUser.tsx";
import { isEmailValid } from "../../utils/functions.jsx";
import { FLOW_TYPES, OIDC_REDIRECT } from "../../utils/constants.jsx";
import { userProfileDispatch } from "../../utils/userProfileDispatch.jsx";
import { useNavigateHelper } from "../../hooks/useNavigate.tsx";



function PrivateRoute() {
    const { state } = useUser();

    useEffect(() => {
        if (!state.isLoading && !state.userProfile) {
            window.location.href = OIDC_REDIRECT.login;
        }
    }, [state.isLoading, state.userProfile]);

    if (state.isLoading) return <div>Loading...</div>;
    if (!state.userProfile) return null;

    return <Outlet />;
}

function StepupPrivateRoute() {
    const { state, dispatch } = useUser();
    const { setAuthenticatedPage } = userProfileDispatch(dispatch);
    const { pathname } = useLocation();
    const [searchParams] = useSearchParams();
    const navigateHelper = useNavigateHelper();
    const returnToPageKey = "returnToPage";
    const returnToPagePath = searchParams.get(returnToPageKey);

    console.log(pathname, "location pathname");

    useEffect(() => {
        if (state.isLoading) return;
        if (!state.userProfile) return;
        const isAuthenticatedPage = state.authenticatedPages.includes(pathname);
        if (isAuthenticatedPage) return; // without this you will get into a redirect loop

        if (!returnToPagePath || returnToPagePath != pathname) {
            window.location.href = `${OIDC_REDIRECT.reauth}?${returnToPageKey}=${encodeURIComponent(pathname)}`;
        } else {
            setAuthenticatedPage(pathname);
            navigateHelper(returnToPagePath, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.isLoading, state.userProfile, pathname, returnToPagePath]);



    return <Outlet />;
}

const signUp = {
    checkSignUpPage: (state) => {
        return state.userData.viewPrivacy;
    },
    checkVerificationPage: (state, type) => {
        if (type === FLOW_TYPES.email) {
            return signUp.checkSignUpPage(state) && isEmailValid(state.userData.email);
        }
        else {
            return signUp.checkVerificationSetUpPage(state) && state.userData.stepVerificationSent && state.userData.phone;
        }
    },
    checkPasswordPage: (state) => {
        return signUp.checkVerificationPage(state, 'email') && state.userData.emailValidated;
    },
    checkVerificationSetUpPage: (state) => {
        return signUp.checkPasswordPage(state) && state.userData.passwordSubmitted && state.userData.id;
    },
    checkCoreProfilePage: (state) => {
        return signUp.checkVerificationPage(state, null) && state.userData.stepVerified;
    }
}

const signIn = {
    checkPasswordPage: (state) => {
        return isEmailValid(state.userData.email)
    },
    checkLoginValidation: (state) => {
        return signIn.checkPasswordPage(state) && state.userData.passwordValidated && state.userData.phone && state.userData.id;

    }
}

export { PrivateRoute, StepupPrivateRoute };