import type { Dispatch } from "react";

import { CONTEXT_ACTIONS, SERVICES } from "../utils/constants";

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
  id: string;
  linkName: string;
  url: string;
}

export interface UserData {
  service: string;
  language: string;
  email: string | null;
  emailLanguage: string | null;
  emailValidated: boolean;
  trxnId: string | null;
  passwordSubmitted: boolean;
  phone: string | null;
  stepVerificationSent: boolean;
  stepVerified: boolean;
  viewPrivacy: boolean;
  id: string | null;
  otpType: string | null;
  passwordValidated: boolean;
}

export interface UserState {
  userProfile: UserProfile | null;
  userData: UserData;
  isLoading: boolean;
  loadingText: string | null;
  relyingPartyInfo: RelyingPartyInfo | null;
  authenticatedPages: string[];
}

export type LoadingStatePayload = {
  isLoading: boolean;
  text?: string | null;
};

export type UserAction =
  | {
      type: typeof CONTEXT_ACTIONS.set_loading;
      payload: boolean | LoadingStatePayload;
    }
  | {
      type: typeof CONTEXT_ACTIONS.updated_profile_success;
      payload: UserProfile | null;
    }
  | {
      type: typeof CONTEXT_ACTIONS.set_relying_party_data;
      payload: RelyingPartyInfo | null;
    }
  | {
      type: typeof CONTEXT_ACTIONS.set_authenticated_pages;
      payload: string;
    }
  | {
      type: typeof CONTEXT_ACTIONS.remove_authenticated_page;
      payload: string;
    };

export type UserDispatch = Dispatch<UserAction>;

export interface UserContextValue {
  state: UserState;
  dispatch: UserDispatch;
}

export interface SessionTimeoutState {
  showModal: boolean;
  isLoading: boolean;
  expirationTime: number | null;
  newServerSideExpirationTime: number | null;
}

export const initialUserState: UserState = {
  isLoading: true,
  loadingText: null,
  userData: {
    service: SERVICES[0].title,
    language: "en",
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

export const initialSessionTimeoutState: SessionTimeoutState = {
  showModal: false,
  isLoading: false,
  expirationTime: null,
  newServerSideExpirationTime: null,
};
