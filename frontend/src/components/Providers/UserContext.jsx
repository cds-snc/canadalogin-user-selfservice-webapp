import {createContext, useReducer, useContext} from "react";
import {SERVICES, CONTEXT_ACTIONS} from "../../utils/constants.jsx";

const initialState = {
    isAuthenticated: false,
    userData: {
        service: SERVICES[0].title, //to be set later when url referrer is given, also need to refactor other pages to use this value
        language: 'en', //to be set later when refactoring possibly
        email: null,
        emailLanguage: null,
        emailValidated: false,
        trxnId: null
    }
}


function userReducer(state=initialState, action) {
    switch (action.type) {
        case CONTEXT_ACTIONS.signUp:
            return {
                ...state,
                userData: action.payload
            };
        case CONTEXT_ACTIONS.logOut:
            return {
                initialState
            };
        default:
            return state;
    }
}

const UserContext = createContext();

export function UserProvider ({ children }) {
    const [state, dispatch] = useReducer(userReducer, initialState);

    return(
        <UserContext.Provider value={{state, dispatch}} >
            {children}
        </UserContext.Provider>
    )
}

export function useUser (){
    const context = useContext(UserContext);

    if(!context)
        throw new Error("useUser should be used within a Provider");

    return context;
}