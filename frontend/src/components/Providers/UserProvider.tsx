import { useReducer, useEffect, ReactNode } from "react";
import { SERVICES, CONTEXT_ACTIONS } from "../../utils/constants.jsx";
import UserContext from "./UserContext";
import { authService } from "../../services/authService.jsx";

interface Action {
    type: string
    payload: any
}

export interface UserProfile {
    id: string;
    active: boolean;
    details: null | {
        emailVerified: boolean | null;
        lastLogin: string | null;
        lastMFA: string | null;
        twoFactorAuthentication: boolean;
        pwdChangedTime: string | null;
    };
    emails: null | Array<{ value: string; type: string }>;
    phoneNumbers: null | Array<{ value: string; type: string }>;
    meta: {
        created: string;
        location: string;
        lastModified: string;
        resourceType: string;
    };
    userName: string;
    preferredLanguage?: string;
    name?: {
        givenName?: string;
        familyName?: string;
        formatted?: string;
    };
}
export interface UserState {
    userProfile: UserProfile | null;
    userData: any;
    isLoading: boolean;
}

interface UserProviderProps {
    children: ReactNode;
    initial?: UserState;
    payload: any
}


interface UserProviderProps {
    children: ReactNode;
    initial?: UserState;
}


const initialState = {
    isLoading: false,
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
    userProfile: {
        active: true,
        details: { emailVerified: null, lastLogin: '2025-07-15T20:40:15Z', lastMFA: null, twoFactorAuthentication: false, pwdChangedTime: '2025-07-14T14:04:48Z' },
        emails: null,
        id: "772001FQY9",
        meta: { created: '2025-07-14T14:04:48Z', location: 'https://cds-gcsignin-dev.verify.ibm.com/v2.0/Users/772001FQY9', lastModified: '2025-07-15T20:40:15Z', resourceType: 'User' },
        name: { formatted: 'Test Here', familyName: 'Here', givenName: 'Test' },
        phoneNumbers: null,
        preferredLanguage: "en-ca",
        userName: "mahamoud.mohamoud+1@cds-snc.ca"
    },
    editProfile: null
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
                userProfile: action.payload,
                isLoading: false
            };
        case CONTEXT_ACTIONS.signin_failure:
            return {
                ...state,
                userProfile: null,
                isLoading: false
            };
        case CONTEXT_ACTIONS.clone_profile:
            return {
                ...state,
                editProfile: { ...state.userProfile || {} }
            };
        case CONTEXT_ACTIONS.update_profile:
            console.log(action.payload)
            return {
                ...state,
                editProfile: {
                    ...state.editProfile || {},
                    ...action.payload
                }
            };
        case CONTEXT_ACTIONS.updated_profile_success:
            return {
                ...state,
                userProfile: action.payload,
            };
        case CONTEXT_ACTIONS.clone_profile:
            return {
                ...state,
                editProfile: { ...state.userProfile || {} }
            };
        case CONTEXT_ACTIONS.update_profile:
            console.log(action.payload)
            return {
                ...state,
                editProfile: {
                    ...state.editProfile || {},
                    ...action.payload
                }
            };
        case CONTEXT_ACTIONS.updated_profile_success:
            return {
                ...state,
                userProfile: action.payload,
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
                if (response && response.data) {
                    dispatch({ type: CONTEXT_ACTIONS.signin_success, payload: response.data });
                }
                else {
                    dispatch({ type: CONTEXT_ACTIONS.signin_failure, payload: null });
                }
            } catch (err) {
                dispatch({ type: CONTEXT_ACTIONS.signin_failure, payload: null });

                console.log(err);
            }
        };

        fetchUser();

    }, []);
    return (
        <UserContext.Provider value={{ state, dispatch }} >
            {children}
        </UserContext.Provider>
    )
}
