import { useEffect } from "react";
import { Outlet } from "react-router";
import { useUser } from "./useUser.tsx";
import { isEmailValid } from "../../utils/functions.jsx";
import { FLOW_TYPES, PAGES, OIDC_REDIRECT } from "../../utils/constants.jsx";


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

// function isValidRoute(page, state, flow, type) {

//     if (flow === FLOW_TYPES.signIn)
//         switch (page) {
//             case (PAGES.password):
//                 return signIn.checkPasswordPage(state);
//             case (PAGES.verification):
//                 return signIn.checkLoginValidation(state);
//             case (PAGES.verificationSelection):
//                 return signIn.checkLoginValidation(state);
//             default:
//                 return false;
//         }

//     switch (page) {
//         case (PAGES.coreProfile):
//             return signUp.checkCoreProfilePage(state);
//         case (PAGES.verification):
//             return signUp.checkVerificationPage(state, type);
//         case (PAGES.verificationSetUp):
//             return signUp.checkVerificationSetUpPage(state);
//         case (PAGES.password):
//             return signUp.checkPasswordPage(state);
//         case (PAGES.signup):
//             return signUp.checkSignUpPage(state);
//         default:
//             return false;

//     }
// }

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

export default PrivateRoute;