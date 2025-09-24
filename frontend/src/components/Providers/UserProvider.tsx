import { useReducer, useEffect, ReactNode } from "react";
import { useSearchParams, useParams } from "react-router";
import {
  useEventSource,
  useEventSourceListener,
} from "@react-nano/use-event-source";
import config from "../../config";
import {
  SERVICES,
  CONTEXT_ACTIONS,
  SUBMIT_END_POINTS,
  RP_CLIENT_ID_KEY,
} from "../../utils/constants.jsx";
import UserContext from "./UserContext";
import { authService } from "../../services/authService.jsx";
import Loader from "../Layout/Loading.jsx";
import { getPageContent } from "../../utils/functions.jsx";

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
  action: Action,
): UserState {
  switch (action.type) {
    case CONTEXT_ACTIONS.set_loading:
      return {
        ...state,
        isLoading: action.payload.isLoading,
        loadingText: action.payload.text || null,
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
          (page) => page !== action.payload,
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
  const { language } = useParams();
  const pageContentJson = getPageContent(language, "SessionManagement");

  const [eventSource, eventSourceStatus] = useEventSource(
    `${config.apiUrl}${SUBMIT_END_POINTS.sessionStatus}`,
    true,
  );

  useEventSourceListener(
    eventSource,
    ["expired", "error", "notification", "terminated"],
    (event) => {
      if (event.type === "expired" || event.type === "terminated") {
        console.log("SSE expired or terminated:", event.data);
        if (eventSource) eventSource.close();
        dispatch({
          type: CONTEXT_ACTIONS.set_loading,
          payload: { isLoading: true, text: pageContentJson["1"] },
        });
      }
      if (event.type === "error") {
        // for debugging purpose. No need to handle it.
        console.error("SSE error:", event.data);
      }
      if (event.type === "notification") {
        // Handle notification event if needed
        // Placeholder for pop-up notification. To be implemented.
        // need to reset the two timers, one for warning, one for expiry
        // clearTimeout(warningTimer);
        // clearTimeout(expiryTimer);
        console.log("SSE notification:", event.data);
      }
    },
    [dispatch], // Dependencies for the listener callback
  );

  useEffect(() => {
    if (state.isLoading && state.loadingText) {
      // After state is set to terminating, wait 2 seconds then redirect
      const timer = setTimeout(() => {
        window.location.href = "/";
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.isLoading, state.loadingText]);

  useEffect(() => {
    const getRelyingPartyInfo = async () => {
      try {
        const response = await authService.get_rp_info();
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

    // Simple authentication check - if we're not loading and don't have a profile,
    // we let PrivateRoute handle the OIDC redirect
    const fetchProfileAndRelyingPartyInfo = async () => {
      try {
        // This is the first request made after the OIDC redirect back to the app
        // Try to get user profile to see if user is authenticated
        // Relying party info (rp_client_id) is passed in the query param of the redirect URL
        // but after the first request, subsequent requests do not have the rp_client_id
        // as it's a session based authentication, the backend keeps track of the session
        // and the relying party info associated with the session
        // so we need to pass the rp_client_id to the backend to store in the session otherwise it will be lost
        const rp_client_id = searchParams.get(RP_CLIENT_ID_KEY);

        const response = await authService.get_my_user_profile(rp_client_id);
        if (response && response.data) {
          // User is authenticated, set the profile
          dispatch({
            type: CONTEXT_ACTIONS.updated_profile_success,
            payload: response.data,
          });
          // Now that we have the profile, we can get the relying party info if not already set
          await getRelyingPartyInfo();
        }
      } catch (err) {
        console.log("User not authenticated:", err);
        // User not authenticated - this will trigger OIDC redirect in PrivateRoute
      } finally {
        // Always set loading to false so PrivateRoute can handle the logic
        dispatch({ type: CONTEXT_ACTIONS.set_loading, payload: false });
      }
    };

    fetchProfileAndRelyingPartyInfo();
  }, []);

  useEffect(() => {}, []);

  if (state.isLoading && state.loadingText) {
    return <Loader text={state.loadingText} />;
  }

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
}
