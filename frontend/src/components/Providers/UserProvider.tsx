import { useReducer, useEffect, useRef, useMemo } from "react";
import type { ReactNode } from "react";
import { useSearchParams, useParams } from "react-router";
import {
  useEventSource,
  useEventSourceListener,
} from "@react-nano/use-event-source";
import config from "../../config";
import {
  CONTEXT_ACTIONS,
  SUBMIT_END_POINTS,
  RP_CLIENT_ID_KEY,
  OIDC_REDIRECT,
} from "../../utils/constants";
import UserContext from "./UserContext";
import { authService } from "../../services/authService";
import Loader from "../Layout/Loading";
import SessionTimeoutModal from "../Layout/SessionTimeoutModal";
import { useTranslation } from "react-i18next";
import type {
  SessionTimeoutState,
  UserAction,
  UserProfile,
  UserState,
} from "../../types/user";
import {
  initialSessionTimeoutState as defaultSessionTimeoutState,
  initialUserState,
} from "../../types/user";

type SessionTimeoutAction =
  | {
      type: typeof CONTEXT_ACTIONS.show_session_timeout_modal;
      payload: number | null;
    }
  | {
      type: typeof CONTEXT_ACTIONS.hide_session_timeout_modal;
    }
  | {
      type: typeof CONTEXT_ACTIONS.reset_expire_time;
      payload: number | null;
    };

interface UserProviderProps {
  children: ReactNode;
  initial?: UserState;
  initialSessionTimeoutState?: SessionTimeoutState;
}

function userReducer(
  state: UserState = initialUserState,
  action: UserAction,
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
  state: SessionTimeoutState = defaultSessionTimeoutState,
  action: SessionTimeoutAction,
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

// Session timeout configuration (in milliseconds)
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry

export function UserProvider({
  children,
  initial = initialUserState,
  initialSessionTimeoutState = defaultSessionTimeoutState,
}: UserProviderProps) {
  const hasCustomInitialState = initial !== initialUserState;
  const [userState, userDispatch] = useReducer(userReducer, initial);
  const [sessionTimeoutState, sessionTimeoutDispatch] = useReducer(
    sessionTimeoutReducer,
    initialSessionTimeoutState,
  );
  const [searchParams] = useSearchParams();
  const { language } = useParams();
  const { t } = useTranslation("layout");

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
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const expireTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleLogoutRef = useRef<() => Promise<void>>(null);
  const shouldConnectSSE = Boolean(
    userState.userProfile && !userState.isLoading,
  );
  const sseUrl = shouldConnectSSE
    ? `${config.apiUrl}${SUBMIT_END_POINTS.sessionStatus}`
    : ""; // Empty string prevents connection

  const [eventSource] = useEventSource(
    sseUrl, // Connects after user authentication
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
      handleLogoutRef.current?.();
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
      }, timeUntilWarning) as unknown as NodeJS.Timeout;
    } else {
      // If less than 5 minutes remain, show the modal immediately
      sessionTimeoutDispatch({
        type: CONTEXT_ACTIONS.show_session_timeout_modal,
        payload: expireTimeMs,
      });
    }

    // Set expire timer
    expireTimerRef.current = setTimeout(() => {
      handleLogoutRef.current?.();
    }, timeUntilExpire) as unknown as NodeJS.Timeout;

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
      });
      sessionTimeoutDispatch({
        type: CONTEXT_ACTIONS.reset_expire_time,
        payload: Number(response?.data?.expire ?? 0),
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
      const redirectUrl = response?.data?.redirect_url || null;

      // Check if response has redirect_url
      if (redirectUrl) {
        // form been submitted in authService.logout
        return;
      } else {
        // Fallback redirect if no redirect_url provided
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Update loading text to show error
      userDispatch({
        type: CONTEXT_ACTIONS.set_loading,
        payload: {
          isLoading: true,
          text: t("SessionManagement.signOutFailed"),
        },
      });
      clearTimers();
      if (eventSource) {
        eventSource.close();
      }

      // Redirect after error
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  // Keep ref current so setTimeout callbacks always call the latest handleLogout
  handleLogoutRef.current = handleLogout;

  useEventSourceListener(
    eventSource,
    ["expired", "error", "notification", "terminated"],
    (event) => {
      if (event.type === "expired") {
        // Session expired - proceed with logout button
        if (eventSource) {
          eventSource.close();
        }
        clearTimers();
      }
      if (event.type === "terminated") {
        // Handle backchannel logout
        userDispatch({
          type: CONTEXT_ACTIONS.set_loading,
          payload: { isLoading: true, text: t("SessionManagement.signingOut") },
        });
        // Redirect after backchannel logout with a slight delay to show loading message
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
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
                payload: Number(eventData.expire),
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

  // Fetch user profile once on mount. Separated from the eventSource cleanup
  // effect so that eventSource changes (retries on empty URL) don't re-trigger
  // the profile fetch.
  useEffect(() => {
    if (hasCustomInitialState) {
      return;
    }

    const getRelyingPartyInfo = async () => {
      try {
        const response = await authService.get_rp_info();
        if (response && response.data && response.data.id) {
          userDispatch({
            type: CONTEXT_ACTIONS.set_relying_party_data,
            payload: response.data,
          });
        }
      } catch (err) {
        console.error("Error in getting relying party info:", err);
      }
    };

    const fetchProfileAndRelyingPartyInfo = async () => {
      try {
        const rp_client_id = searchParams.get(RP_CLIENT_ID_KEY) ?? undefined;
        const response = await authService.get_my_user_profile(rp_client_id);
        if (response && response.data) {
          userDispatch({
            type: CONTEXT_ACTIONS.updated_profile_success,
            payload: response.data as UserProfile,
          });
          await getRelyingPartyInfo();
        }
      } catch (err) {
        console.log("User not authenticated:", err);
        // After a deliberate logout, redirect immediately with prompt=login so IBM
        // Verify shows the login form instead of silently re-authenticating.
        if (sessionStorage.getItem("post_logout") === "true") {
          sessionStorage.removeItem("post_logout");
          window.location.href = `${OIDC_REDIRECT.login}?prompt=login`;
          return;
        }
      } finally {
        userDispatch({
          type: CONTEXT_ACTIONS.set_loading,
          payload: { isLoading: false, text: t("SessionManagement.loading") },
        });
      }
    };

    fetchProfileAndRelyingPartyInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up eventSource and timers when eventSource changes or on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  // Start timers when newServerSideExpirationTime is set/updated
  useEffect(() => {
    latestExpireRef.current = sessionTimeoutState.newServerSideExpirationTime;
    if (sessionTimeoutState.newServerSideExpirationTime) {
      resetSessionTimers(sessionTimeoutState.newServerSideExpirationTime);
    }

    return () => {};
    // resetSessionTimers is stable in practice (uses refs + dispatch), but isn't
    // wrapped in useCallback to keep the component readable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionTimeoutState.newServerSideExpirationTime]);

  if (userState.isLoading) {
    return (
      <Loader
        text={
          userState.loadingText
            ? userState.loadingText
            : t("SessionManagement.loading")
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
        currentLang={language ?? "en"}
      />
    </UserContext.Provider>
  );
}
