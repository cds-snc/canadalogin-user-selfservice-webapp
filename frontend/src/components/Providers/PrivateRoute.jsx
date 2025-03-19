import {Navigate} from "react-router";
import {useUser} from "./UserContext.jsx";
import {isEmailValid} from "../../utils/functions.jsx";


function PrivateRoute ({route, children}){
    const {state} = useUser();

    if((route==="signUpVerification" && !state.userData.emailValidated && !isEmailValid(state.userData.email) && !state.userData.passwordSubmitted) ||
        (route==="signUpPassword" && !state.userData.emailValidated && !isEmailValid(state.userData.email)) ||
        (route==="signUpVerifyEmail" && !isEmailValid(state.userData.email)))
        return <Navigate to="/" />;

    return children;
}

export default PrivateRoute;