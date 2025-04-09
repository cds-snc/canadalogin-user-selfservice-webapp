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
    const {flow} = useParams();


    if(flow===FLOW_TYPES.signIn)
        switch (page) {
            case(PAGES.verification):
                return true;
            default:
                return false;
        }

    if(!isEmailValid(state.userData.email))
        return false;

    switch(page){
        case("signUpCoreProfile"):
            return (
                state.userData.stepVerified &&
                state.userData.stepVerificationSent &&
                state.userData.passwordSubmitted &&
                state.userData.emailValidated);
        case("signUpVerifyTwoStep"):
            return (state.userData.stepVerificationSent &&
                    state.userData.passwordSubmitted &&
                    state.userData.emailValidated);
        case(PAGES.verification):
            return (state.userData.passwordSubmitted &&
                    state.userData.emailValidated );
        case("signUpPassword"):
            return (state.userData.emailValidated);
        default:
            return true;

    }
}
export default PrivateRoute;