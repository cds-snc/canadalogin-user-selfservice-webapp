import { useReducer, useEffect, ReactNode } from "react";
import { SERVICES, CONTEXT_ACTIONS } from "../../utils/constants.jsx";
import UserContext from "./UserContext";
import { authService } from "../../services/authService.jsx";


interface Action {
    type: string
    payload: any
}

interface UserState {
    isAuthenticated: boolean;
    userSession: string | null;
    userData: any;
    isLoading: boolean;
}

interface UserProviderProps {
    children: ReactNode;
    initial?: UserState;
}

const initialState = {
    isAuthenticated: false,
    isLoading: true,
    userData: {
        service: SERVICES[0].title, //to be set later when url referrer is given, also need to refactor other pages to use this value
        language: 'en', //to be set later when refactoring possibly
        email: null,
        emailLanguage: null,
        emailValidated: false,
        trxnId: null,
        passwordSubmitted: false,
        phone: null,
        stepVerificationSent: false,
        stepVerified: false,
        viewPrivacy: false,
        id: null,
        otpType: null,
        passwordValidated: false
    },
    userSession: null
}


function userReducer(state = initialState, action: Action) {
    switch (action.type) {
        case CONTEXT_ACTIONS.signUp:
            return {
                ...state,
                userData: action.payload
            };
        case CONTEXT_ACTIONS.signin_success:
            return {
                ...state,
                userSession: action.payload,
                isLoading: false
            };
        case CONTEXT_ACTIONS.signin_failure:
            return {
                ...state,
                userSession: null,
                isLoading: false
            };
        default:
            return state;
    }
}

export function UserProvider({ children, initial = initialState }: UserProviderProps) {

    const [state, dispatch] = useReducer(userReducer, initial);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await authService.my_user_profile();
                if (response)
                    dispatch({ type: CONTEXT_ACTIONS.signin_success, payload: response });
                else {
                    dispatch({ type: CONTEXT_ACTIONS.signin_failure, payload: null });
                }
            } catch (err) {
                console.log(err);
            }
        };

        fetchUser();

    }, []);
    console.log("state", state)
    return (
        <UserContext.Provider value={{ state, dispatch }} >
            {children}
        </UserContext.Provider>
    )
}
