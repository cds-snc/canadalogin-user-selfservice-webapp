import {createContext, useReducer, useContext} from "react";
import {SERVICES} from "../../utils/constants.jsx";
import {useParams} from "react-router";

const initialState = {
    isAuthenticated: false,
    userData: {
      service: SERVICES[0].title, //to be set later when url referrer is given, also need to refactor other pages to use this value
      language: 'en', //to be set later when refactoring possibly
      email: null,
      emailLanguage: null,
      emailValidated: false
    }
}

const SET_USER = 'SET_USER';
const SET_EMAIL = 'SET_EMAIL';
const LOG_OUT = 'LOG_OUT';

function userReducer(state=initialState, action=LOG_OUT) {
    switch (action.type) {
        case SET_EMAIL:
            return {
                ...state,
                userData: action.payload
            };
        case LOG_OUT:
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