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

    switch(route){
        case("signUpVerifyTwoStep"):
            return (state.userData.stepVerificationSent &&
                    state.userData.passwordSubmitted &&
                    state.userData.emailValidated &&
                    isEmailValid(state.userData.email));
        case("signUpVerification"):
            return (state.userData.passwordSubmitted &&
                    state.userData.emailValidated &&
                    isEmailValid(state.userData.email));
        case("signUpPassword"):
            return (state.userData.emailValidated &&
                    isEmailValid(state.userData.email));
        case("signUpVerifyEmail"):
            return isEmailValid(state.userData.email);
        default:
            return false;

    }
}
export default PrivateRoute;