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
            return checkCoreProfilePage(state);
        case(PAGES.verification):
            return checkVerificationPage(state, type);
        case(PAGES.verificationSetUp):
            return checkVerificationSetUpPage(state);
        case(PAGES.password):
            return  checkPasswordPage(state);
        case(PAGES.signup):
            return checkSignUpPage(state);
        default:
            return false;

    }
}

function checkSignUpPage(state){
    return state.userData.viewPrivacy;
}

function checkVerificationPage(state, type){
    if(type===FLOW_TYPES.email)
        return checkSignUpPage(state)&&isEmailValid(state.userData.email);
    else
        return checkVerificationSetUpPage(state)&&state.userData.stepVerificationSent&&state.userData.phone;
}

function checkPasswordPage(state){
    return checkSignUpPage(state)&&state.userData.emailValidated;
}

function checkVerificationSetUpPage(state){
    return checkPasswordPage(state)&&state.userData.passwordSubmitted&&state.userData.id;
}

function checkCoreProfilePage(state){
    return checkVerificationPage(state, null)&&state.userData.stepVerified;
}
export default PrivateRoute;