import { useReducer, useEffect, ReactNode } from "react";
import { useSearchParams } from "react-router";
import { SERVICES, CONTEXT_ACTIONS } from "../../utils/constants.jsx";
import UserContext from "./UserContext";
import { authService } from "../../services/authService.jsx";

interface Action {
  type: string;
  payload: any;
}

export interface UserProfile {
  id: string;
  active: boolean;
  details?: null | {
    emailVerified: boolean | null;
    lastLogin: string | null;
    lastMFA: string | null;
    twoFactorAuthentication: boolean;
    pwdChangedTime: string | null;
  };
  emails?: null | Array<{ value: string; type: string }>;
  phoneNumbers?: null | Array<{ value: string; type: string }>;
  meta?: {
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
  } | null;
}

export interface RelyingPartyInfo {
  icon: string;
  id: string;
  linkName: string;
  url: string;
}

export interface UserState {
    userProfile: UserProfile | null;
    userData: any;
    isLoading: boolean;
    loadingText: string | null;
    editProfile: UserProfile | null;
    urlLanguageBeforeEdit: string | null;
    cancelProfileEditing: boolean;
    relyingPartyInfo: RelyingPartyInfo | null;
    authenticatedPages: string[];
}

interface UserProviderProps {
  children: ReactNode;
  initial?: UserState;
}

const initialState: UserState = {
  isLoading: true,
    loadingText: null,
  userData: {
    service: SERVICES[0].title, //to be set later when url referrer is given, also need to refactor other pages to use this value
    language: "en", //to be set later when refactoring possibly
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
    passwordValidated: false,
  },
  userProfile: null,
  editProfile: null,
  urlLanguageBeforeEdit: null,
  cancelProfileEditing: false,
  relyingPartyInfo: null,
  authenticatedPages: [],
};

function userReducer(
  state: UserState = initialState,
  action: Action
): UserState {
  switch (action.type) {
        case CONTEXT_ACTIONS.set_loading:
            return {
                ...state,
                isLoading: action.payload.isLoading,
                loadingText: action.payload.text || null
            };
    case CONTEXT_ACTIONS.clone_profile:
      return {
        ...state,
        editProfile: state.userProfile ? { ...state.userProfile } : null,
        cancelProfileEditing: false,
        urlLanguageBeforeEdit: null,
      };
    case CONTEXT_ACTIONS.update_cloned_profile:
      return {
        ...state,
        editProfile: state.editProfile
          ? {
              ...state.editProfile,
              ...action.payload,
            }
          : null,
      };
    case CONTEXT_ACTIONS.updated_profile_success:
      return {
        ...state,
        userProfile: action.payload,
      };
    case CONTEXT_ACTIONS.clear_edit_profile:
      return {
        ...state,
        editProfile: null,
        cancelProfileEditing: true,
      };
    case CONTEXT_ACTIONS.set_original_language_before_edit:
      return {
        ...state,
        urlLanguageBeforeEdit: action.payload,
      };
    case CONTEXT_ACTIONS.cancel_profile_editing:
      return {
        ...state,
        cancelProfileEditing: action.payload,
      };
    case CONTEXT_ACTIONS.set_relying_party_data:
      return {
        ...state,
        relyingPartyInfo: action.payload,
      };
    case CONTEXT_ACTIONS.set_authenticated_pages:
      return {
        ...state,
        authenticatedPages: [...state.authenticatedPages, action.payload],
      };
    case CONTEXT_ACTIONS.remove_authenticated_page:
      return {
        ...state,
        authenticatedPages: state.authenticatedPages.filter(
          (page) => page !== action.payload
        ),
      };
    case CONTEXT_ACTIONS.set_loading:
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

export function UserProvider({
  children,
  initial = initialState,
}: UserProviderProps) {
  const [state, dispatch] = useReducer(userReducer, initial);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Simple authentication check - if we're not loading and don't have a profile,
    // we let PrivateRoute handle the OIDC redirect
    const checkAuth = async () => {
      try {
        // Try to get user profile to see if user is authenticated
        const response = await authService.get_my_user_profile();
        if (response && response.data) {
          // User is authenticated, set the profile
          dispatch({
            type: CONTEXT_ACTIONS.updated_profile_success,
            payload: response.data,
          });
        }
      } catch (err) {
        console.log("User not authenticated:", err);
        // User not authenticated - this will trigger OIDC redirect in PrivateRoute
      } finally {
        // Always set loading to false so PrivateRoute can handle the logic
        dispatch({ type: CONTEXT_ACTIONS.set_loading, payload: false });
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const setRelyingPartyInfo = async () => {
      const rpKey = "rp";
      if (
        typeof window === "undefined" ||
        typeof sessionStorage === "undefined"
      )
        return;
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
          dispatch({
            type: CONTEXT_ACTIONS.set_relying_party_data,
            payload: response.data,
          });
        } else {
          console.error("Error in getting relying party info:", response);
        }
      } catch (err) {
        console.error("Error in getting relying party info:", err);
      }
    };
    setRelyingPartyInfo();
  }, []);

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
}
