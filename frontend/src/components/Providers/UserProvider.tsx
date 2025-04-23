import {useReducer} from "react";
import {SERVICES, CONTEXT_ACTIONS} from "../../utils/constants.jsx";
import UserContext from "./UserContext";

interface Action {
    type: string
    payload: JSON
}

const initialState = {
    isAuthenticated: false,
    userData: {
        service: SERVICES[0].title, //to be set later when url referrer is given, also need to refactor other pages to use this value
        language: 'en', //to be set later when refactoring possibly
        email: null,
        emailLanguage: null,
        emailValidated: false,
        trxnId: null,
        passwordSubmitted:false,
        phone: null,
        stepVerificationSent: false,
        stepVerified:false,
        viewPrivacy:false

    }
}


function userReducer(state=initialState, action: Action) {
    switch (action.type) {
        case CONTEXT_ACTIONS.signUp:
            return {
                ...state,
                userData: action.payload
            };
        default:
            return state;
    }
}

export function UserProvider ({ children, initial=initialState}) {

    const [state, dispatch] = useReducer(userReducer, initial);

    return(
        <UserContext.Provider value={{state, dispatch}} >
            {children}
        </UserContext.Provider>
    )
}
