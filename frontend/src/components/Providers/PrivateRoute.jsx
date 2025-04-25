import {Navigate, useParams} from "react-router";
import {useUser} from "./useUser.tsx";
import {isEmailValid} from "../../utils/functions.jsx";
import {FLOW_TYPES, PAGES} from "../../utils/constants.jsx";


function PrivateRoute ({route, children}){
    const {state} = useUser();
    const {flow, type} = useParams();

    if(!isValidRoute(route, state, flow, type))
        return <Navigate to="/" />;

    return children;
}


function isValidRoute (page, state, flow, type) {



    if(flow===FLOW_TYPES.signIn)
        switch (page) {
            case(PAGES.verification):
                return true;
            case(PAGES.password):
                return true;
            default:
                return false;
        }

    switch(page){
        case(PAGES.coreProfile):
            return (
                state.userData.stepVerified &&
                state.userData.stepVerificationSent &&
                state.userData.passwordSubmitted &&
                state.userData.emailValidated &&
                state.userData.viewPrivacy);
        case(PAGES.verification):
            if(type===FLOW_TYPES.email)
                return isEmailValid(state.userData.email &&
                    state.userData.viewPrivacy);
            return (state.userData.stepVerificationSent &&
                    state.userData.passwordSubmitted &&
                    state.userData.emailValidated &&
                    state.userData.viewPrivacy);
        case(PAGES.verificationSetUp):
            return (state.userData.passwordSubmitted &&
                    state.userData.emailValidated &&
                    state.userData.viewPrivacy);
        case(PAGES.password):
            return (state.userData.emailValidated &&
                state.userData.viewPrivacy);
        default:
            return false;

    }
}
export default PrivateRoute;