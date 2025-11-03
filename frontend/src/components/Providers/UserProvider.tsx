import { useReducer, useEffect, ReactNode, useRef, useMemo } from "react";
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
  relyingPartyInfo: RelyingPartyInfo | null;
  authenticatedPages: string[];
}

export interface SessionTimeoutState {
  showModal: boolean;
  isLoading: boolean;
  expirationTime: number | null;
  newServerSideExpirationTime: number | null;
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
  relyingPartyInfo: null,
  authenticatedPages: [],
};

const initialSessionState: SessionTimeoutState = {
  showModal: false,
  isLoading: false,
  expirationTime: null,
  newServerSideExpirationTime: null,
};

function userReducer(
  state: UserState = initialState,
  action: Action,
): UserState {
  switch (action.type) {
    case CONTEXT_ACTIONS.set_loading:
      if (typeof action.payload === "boolean") {
        return {
          ...state,
          isLoading: action.payload,
          loadingText: null,
        };
      }
      return {
        ...state,
        isLoading: action.payload.isLoading,
        loadingText: action.payload.text || null,
      };
    case CONTEXT_ACTIONS.updated_profile_success:
      return {
        ...state,
        userProfile: action.payload,
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
    default:
      return state;
  }
}

function sessionTimeoutReducer(
  state: SessionTimeoutState = initialSessionState,
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
        expirationTime: null,
      };
    case CONTEXT_ACTIONS.reset_expire_time:
      // Avoid no-op updates that cause re-renders when the expire time didn't actually change
      if (state.newServerSideExpirationTime === action.payload) {
        return state;
      }
      return {
        ...state,
        newServerSideExpirationTime: action.payload,
      };
    default:
      return state;
  }
}

export function UserProvider({
  children,
  initial = initialState,
  initialSessionTimeoutState = initialSessionState,
}: UserProviderProps) {
  const [userState, userDispatch] = useReducer(userReducer, initial);
  const [sessionTimeoutState, sessionTimeoutDispatch] = useReducer(
    sessionTimeoutReducer,
    initialSessionTimeoutState,
  );
  const [searchParams] = useSearchParams();
  const { language } = useParams();
  const pageContentJson = getPageContent(language, "SessionManagement");

  // keep latest expire in a ref so SSE handler can compare without capturing stale closure state
  const latestExpireRef = useRef<number | null>(
    sessionTimeoutState.newServerSideExpirationTime,
  );

  // Memoize provider value so consumers only re-render when userState or userDispatch change
  const contextValue = useMemo(
    () => ({ state: userState, dispatch: userDispatch }),
    [userState, userDispatch],
  );

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
  const resetSessionTimers = (expireTimestamp: number) => {
    clearTimers();

    // Convert expire timestamp to milliseconds if it's in seconds
    const expireTimeMs = expireTimestamp * 1000;
    const currentTime = Date.now();
    const timeUntilExpire = expireTimeMs - currentTime;

    // Only set timers if expire time is in the future
    if (userState.userProfile && timeUntilExpire <= 0) {
      console.warn("Session already expired based on provided expire time");
      handleLogout();
      return;
    }

    // Set warning timer (5 minutes before expire time, but not if less than 5 minutes remain)
    const timeUntilWarning =
      timeUntilExpire > WARNING_TIME ? timeUntilExpire - WARNING_TIME : 0;
    if (timeUntilWarning > 0) {
      warningTimerRef.current = setTimeout(() => {
        sessionTimeoutDispatch({
          type: CONTEXT_ACTIONS.show_session_timeout_modal,
          payload: expireTimeMs,
        });
      }, timeUntilWarning);
    } else {
      // If less than 5 minutes remain, show the modal immediately
      sessionTimeoutDispatch({
        type: CONTEXT_ACTIONS.show_session_timeout_modal,
        payload: expireTimeMs,
      });
    }

    // Set expire timer
    expireTimerRef.current = setTimeout(async () => {
      await handleLogout();
    }, timeUntilExpire);

    console.log(
      `Session timers set: warning in ${timeUntilWarning}ms, expire in ${timeUntilExpire}ms`,
    );
  };

  // Handle keep session alive
  const handleKeepSession = async () => {
    try {
      const response = await authService.keepAlive();
      sessionTimeoutDispatch({
        type: CONTEXT_ACTIONS.hide_session_timeout_modal,
        payload: null,
      });
      sessionTimeoutDispatch({
        type: CONTEXT_ACTIONS.reset_expire_time,
        payload: response.data.expire,
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
        payload: { isLoading: true, text: pageContentJson["10"] },
      });
      clearTimers();
      if (eventSource) eventSource.close();

      // Redirect after error
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  useEventSourceListener(
    eventSource,
    ["expired", "error", "notification", "terminated"],
    (event) => {
      if (event.type === "expired") {
        // Session expired - proceed with logout button
        if (eventSource) eventSource.close();
        clearTimers();
      }
      if (event.type === "terminated") {
        // Handle backchannel logout
        userDispatch({
          type: CONTEXT_ACTIONS.set_loading,
          payload: { isLoading: true, text: pageContentJson["7"] },
        });
        // Redirect after backchannel logout with a slight delay to show loading message
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
      if (event.type === "error") {
        // for debugging purpose. No need to handle it.
        console.error("SSE error:", event.data);
      }
      if (event.type === "notification") {
        // Parse the event data and check status
        try {
          const eventData = JSON.parse(event.data);

          if (eventData.status === "active" && eventData.expire) {
            // Only dispatch if expire changed to avoid unnecessary re-renders
            if (latestExpireRef.current !== eventData.expire) {
              sessionTimeoutDispatch({
                type: CONTEXT_ACTIONS.reset_expire_time,
                payload: eventData.expire,
              });
            }
          }
        } catch (error) {
          console.error(
            "Error parsing SSE notification data:",
            error,
            event.data,
          );
        }
      }
    },
    [sessionTimeoutDispatch], // Dependencies for the listener callback
  );

  useEffect(() => {
    const getRelyingPartyInfo = async () => {
      try {
        const response = await authService.get_rp_info();
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
          userDispatch({
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
        // Always set loading to false and reset loading text so PrivateRoute can handle the logic
        userDispatch({
          type: CONTEXT_ACTIONS.set_loading,
          payload: { isLoading: false, text: pageContentJson["9"] },
        });
      }
    };

    fetchProfileAndRelyingPartyInfo();
    return () => {
      // Cleanup on unmount
      clearTimers();
      if (eventSource) eventSource.close();
    };
  }, []);

  // Start timers when newServerSideExpirationTime is set/updated
  useEffect(() => {
    latestExpireRef.current = sessionTimeoutState.newServerSideExpirationTime;
    if (sessionTimeoutState.newServerSideExpirationTime) {
      resetSessionTimers(sessionTimeoutState.newServerSideExpirationTime);
    }

    return () => {};
  }, [sessionTimeoutState.newServerSideExpirationTime]);

  if (userState.isLoading) {
    return (
      <Loader
        text={
          userState.loadingText ? userState.loadingText : pageContentJson["9"]
        }
      />
    );
  }

  return (
    <UserContext.Provider value={contextValue}>
      {children}
      <SessionTimeoutModal
        isOpen={sessionTimeoutState.showModal}
        expirationTime={sessionTimeoutState.expirationTime}
        onKeepSession={handleKeepSession}
        onLogout={handleLogout}
        isLoading={sessionTimeoutState.isLoading}
        currentLang={language}
      />
    </UserContext.Provider>
  );
}
