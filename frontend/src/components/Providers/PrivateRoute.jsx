import {Navigate, useParams} from "react-router";
import {useUser} from "./UserContext.jsx";
import {isEmailValid} from "../../utils/functions.jsx";
import {FLOW_TYPES, PAGES} from "../../utils/constants.jsx";


function PrivateRoute ({route, children}){


    if(!isValidRoute(route))
        return <Navigate to="/" />;

    return children;
}


function isValidRoute (page) {
    const {state} = useUser();
    const {flow, type} = useParams();


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
                state.userData.emailValidated);
        case(PAGES.verification):
            if(type===FLOW_TYPES.email)
                return isEmailValid(state.userData.email);

            return (state.userData.stepVerificationSent &&
                    state.userData.passwordSubmitted &&
                    state.userData.emailValidated);
        case(PAGES.verificationSetUp):
            return (state.userData.passwordSubmitted &&
                    state.userData.emailValidated );
        case(PAGES.password):
            return (state.userData.emailValidated);
        default:
            return false;

    }
}
export default PrivateRoute;