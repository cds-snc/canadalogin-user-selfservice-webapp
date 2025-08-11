import { useReducer, useEffect, ReactNode } from "react";
import { useSearchParams } from 'react-router';
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
    editProfile: UserProfile | null;
    urlLanguageBeforeEdit: string | null;
    cancelProfileEditing: boolean;
    relyingPartyInfo: any | null;
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
    userProfile: null,
    editProfile: null,
    urlLanguageBeforeEdit: null,
    cancelProfileEditing: false,
    relyingPartyInfo: null
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
                editProfile: { ...state.userProfile || {} },
                cancelProfileEditing: false,
                urlLanguageBeforeEdit: null,
            };
        case CONTEXT_ACTIONS.update_cloned_profile:
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
                userProfile: action.payload
            };
        case CONTEXT_ACTIONS.clear_edit_profile:
            return {
                ...state,
                editProfile: null,
                cancelProfileEditing: true
            };
        case CONTEXT_ACTIONS.set_original_language_before_edit:
            return {
                ...state,
                urlLanguageBeforeEdit: action.payload
            };
        case CONTEXT_ACTIONS.cancel_profile_editing:
            return {
                ...state,
                cancelProfileEditing: action.payload
            };
        case CONTEXT_ACTIONS.set_relying_party_data:
            return {
                ...state,
                relyingPartyInfo: action.payload
            };
        default:
            return state;
    }
}

export function UserProvider({ children, initial = initialState }: UserProviderProps) {

    const [state, dispatch] = useReducer(userReducer, initial);
    const [searchParams] = useSearchParams();


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

    useEffect(() => {

        const setRelyingPartyInfo = async () => {
            const rpKey = "rp";
            if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;
            let relyingPartyId = sessionStorage.getItem(rpKey);

            const urlRelyingPartyId = searchParams.get(rpKey);
            if (!urlRelyingPartyId && !relyingPartyId) return;
            try {
                if (urlRelyingPartyId) {
                    sessionStorage.setItem(rpKey, urlRelyingPartyId);
                    relyingPartyId = urlRelyingPartyId;
                }

                const response = await authService.get_rp_info(relyingPartyId);
                if (response && response.data && response.data.id) {
                    dispatch({ type: CONTEXT_ACTIONS.set_relying_party_data, payload: response.data });
                }
                else {
                    console.error("Error in getting relying party info:", response);
                }
            } catch (err) {
                console.error("Error in getting relying party info:", err);
            }
        };
        setRelyingPartyInfo();
    }, []);

    return (
        <UserContext.Provider value={{ state, dispatch }} >
            {children}
        </UserContext.Provider>
    )
}
