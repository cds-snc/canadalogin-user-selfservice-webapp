import { useReducer, useEffect, ReactNode, useRef, useState } from "react";
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
} from "../../utils/constants.jsx";
import UserContext from "./UserContext";
import { authService } from "../../services/authService.jsx";
import Loader from "../Layout/Loading.jsx";
import SessionTimeoutModal from "../Layout/SessionTimeoutModal.jsx";
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

export interface SessionTimeoutState {
  showModal: boolean;
  isLoading: boolean;
  expirationTime: number | null;
}

interface UserProviderProps {
  children: ReactNode;
  initial?: UserState;
  initialSessionTimeoutState?: SessionTimeoutState;
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

const initialSessionTimeoutState: SessionTimeoutState = {
  showModal: false,
  isLoading: false,
  expirationTime: null,
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

function sessionTimeoutReducer(
  state: SessionTimeoutState = initialSessionTimeoutState,
  action: Action,
): SessionTimeoutState {
  switch (action.type) {
    case CONTEXT_ACTIONS.show_session_timeout_modal:
      return {
        ...state,
        showModal: true,
        expirationTime: action.payload,
      };
    case CONTEXT_ACTIONS.hide_session_timeout_modal:
      return {
        ...state,
        showModal: false,
        isLoading: false,
      };
    case CONTEXT_ACTIONS.set_session_timeout_loading:
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
  initialSessionTimeoutState,
}: UserProviderProps) {
  const [userState, userDispatch] = useReducer(userReducer, initial);
  const [sessionTimeoutState, sessionTimeoutDispatch] = useReducer(sessionTimeoutReducer, initialSessionTimeoutState);
  const [searchParams] = useSearchParams();
  const { language } = useParams();
  const pageContentJson = getPageContent(language, "SessionManagement");

  // Timer refs for session management
  const warningTimerRef = useRef<number | null>(null);
  const expireTimerRef = useRef<number | null>(null);

  // Session timeout configuration (in milliseconds)
  const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry

  const [eventSource, eventSourceStatus] = useEventSource(
    `${config.apiUrl}${SUBMIT_END_POINTS.sessionStatus}`,
    true,
  );

  // Clear existing timers
  const clearTimers = () => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (expireTimerRef.current) {
      clearTimeout(expireTimerRef.current);
      expireTimerRef.current = null;
    }
  };

  // Start session timers with specific expire time from SSE
  const startSessionTimersWithExpireTime = (expireTimestamp: number) => {
    clearTimers();

    // Convert expire timestamp to milliseconds if it's in seconds
    const expireTimeMs = expireTimestamp * 1000;
    const currentTime = Date.now();
    const timeUntilExpire = expireTimeMs - currentTime;

    // Only set timers if expire time is in the future
    if (timeUntilExpire <= 0) {
      console.warn("Session already expired based on provided expire time");
      return;
    }

    // Set warning timer (5 minutes before expire time, but not if less than 5 minutes remain)
    const timeUntilWarning = timeUntilExpire > WARNING_TIME ? timeUntilExpire - WARNING_TIME : 0;
    if (timeUntilWarning > 0) {
      warningTimerRef.current = setTimeout(() => {
        sessionTimeoutDispatch({
          type: CONTEXT_ACTIONS.show_session_timeout_modal,
          payload: expireTimeMs,
        });
      }, timeUntilWarning);
    }

    // Set expire timer
    expireTimerRef.current = setTimeout(async () => {
      await handleLogout();
    }, timeUntilExpire);

    console.log(`Session timers set: warning in ${timeUntilWarning}ms, expire in ${timeUntilExpire}ms`);
  };

  // Handle keep session alive
  const handleKeepSession = async () => {
    sessionTimeoutDispatch({
      type: CONTEXT_ACTIONS.set_session_timeout_loading,
      payload: true,
    });

    try {
      await authService.keepAlive();
      sessionTimeoutDispatch({
        type: CONTEXT_ACTIONS.hide_session_timeout_modal,
        payload: null,
      });
    } catch (error) {
      console.error("Error keeping session alive:", error);
      // If keepAlive fails, proceed with logout
      handleLogout();
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Set loading state
      userDispatch({
        type: CONTEXT_ACTIONS.set_loading,
        payload: { isLoading: true, text: pageContentJson["7"] },
      });
      const response = await authService.logout();
      // Check if response has redirect_url and redirect
      if (response && response.data && response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
      } else {
        // Fallback redirect if no redirect_url provided
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Update loading text to show error
      userDispatch({
        type: CONTEXT_ACTIONS.set_loading,
        payload: { isLoading: true, text: pageContentJson["9"] },
      });
      // Redirect after error
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } finally {
      clearTimers();
      if (eventSource) eventSource.close();
    }
  };

  useEventSourceListener(
    eventSource,
    ["expired", "error", "notification", "terminated"],
    (event) => {
      if (event.type === "expired" || event.type === "terminated") {
        console.log("SSE expired or terminated:", event.data);
        if (eventSource) eventSource.close();
        clearTimers();
        userDispatch({
          type: CONTEXT_ACTIONS.set_loading,
          payload: { isLoading: true, text: pageContentJson["7"] },
        });
      }
      if (event.type === "error") {
        // for debugging purpose. No need to handle it.
        console.error("SSE error:", event.data);
      }
      if (event.type === "notification") {
        // Parse the event data and check status
        try {
          const eventData = JSON.parse(event.data);
          console.log("SSE notification:", eventData);
          
          if (eventData.status === "active" && eventData.expire) {
            // Reset timers when receiving active status with new expire time
            console.log("SSE notification: resetting session timers based on new expire time", eventData.expire);
            startSessionTimersWithExpireTime(eventData.expire);
            // Always dispatch hide modal action - the reducer will handle the state check
            sessionTimeoutDispatch({
              type: CONTEXT_ACTIONS.hide_session_timeout_modal,
              payload: null,
            });
          } else {
            console.log("SSE notification: status not active or missing expire time", eventData);
          }
        } catch (error) {
          console.error("Error parsing SSE notification data:", error, event.data);
        }
      }
    },
    [userDispatch, sessionTimeoutDispatch], // Dependencies for the listener callback
  );

  useEffect(() => {
    if (userState.isLoading && userState.loadingText) {
      // After state is set to terminating, wait 2 seconds then redirect
      const timer = setTimeout(() => {
        window.location.href = "/";
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [userState.isLoading, userState.loadingText]);

  useEffect(() => {
    // Simple authentication check - if we're not loading and don't have a profile,
    // we let PrivateRoute handle the OIDC redirect
    const checkAuth = async () => {
      try {
        // Try to get user profile to see if user is authenticated
        const response = await authService.get_my_user_profile();
        if (response && response.data) {
          // User is authenticated, set the profile
          userDispatch({
            type: CONTEXT_ACTIONS.updated_profile_success,
            payload: response.data,
          });
        }
      } catch (err) {
        console.log("User not authenticated:", err);
        // User not authenticated - this will trigger OIDC redirect in PrivateRoute
      } finally {
        // Always set loading to false so PrivateRoute can handle the logic
        userDispatch({ type: CONTEXT_ACTIONS.set_loading, payload: false });
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
          userDispatch({
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

  // Start timers when user is authenticated
  useEffect(() => {
    if (userState.userProfile && !userState.isLoading) {
      startSessionTimersWithExpireTime(Date.now() / 1000 + 20 * 60); // Assuming a 20 minute session for default, if not updates from SSE
    }
    
    // Cleanup timers on unmount
    return () => {
      clearTimers();
    };
  }, [userState.userProfile, userState.isLoading]);

  if (userState.isLoading && userState.loadingText) {
    return <Loader text={userState.loadingText} />;
  }

  return (
    <UserContext.Provider value={{ state: userState, dispatch: userDispatch }}>
      {children}
      <SessionTimeoutModal
        isOpen={sessionTimeoutState?.showModal}
        expirationTime={sessionTimeoutState?.expirationTime}
        onKeepSession={handleKeepSession}
        onLogout={handleLogout}
        isLoading={sessionTimeoutState?.isLoading}
        currentLang={language}
      />
    </UserContext.Provider>
  );
}
