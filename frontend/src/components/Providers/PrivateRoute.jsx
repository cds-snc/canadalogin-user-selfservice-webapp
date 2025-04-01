import {Navigate} from "react-router";
import {useUser} from "./UserContext.jsx";
import {isEmailValid} from "../../utils/functions.jsx";


function PrivateRoute ({route, children}){


    if(!isValidRoute(route))
        return <Navigate to="/" />;

    return children;
}


function isValidRoute (route) {
    const {state} = useUser();

    if(!isEmailValid(state.userData.email))
        return false;

    switch(route){
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
        case("signUpVerification"):
            return (state.userData.passwordSubmitted &&
                    state.userData.emailValidated );
        case("signUpPassword"):
            return (state.userData.emailValidated);
        default:
            return true;

    }
}
export default PrivateRoute;