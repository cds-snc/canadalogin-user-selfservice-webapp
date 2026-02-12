import React from "react";
// Shared TypeScript interfaces for the GC Sign In frontend

import { ReactNode } from "react";

/**
 * User profile data structure from IBM Verify API
 */
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

/**
 * Relying party (RP) information
 */
export interface RelyingPartyInfo {
  icon: string;
  id: string;
  linkName: string;
  url: string;
}

/**
 * User data stored in the application context
 */
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

/**
 * Application state for the UserContext
 */
export interface UserState {
  userProfile: UserProfile | null;
  userData: UserData;
  isLoading: boolean;
  loadingText: string | null;
  relyingPartyInfo: RelyingPartyInfo | null;
  authenticatedPages: string[];
}

/**
 * Session timeout state
 */
export interface SessionTimeoutState {
  showModal: boolean;
  isLoading: boolean;
  expirationTime: number | null;
  newServerSideExpirationTime: number | null;
}

/**
 * Action interface for useReducer
 */
export interface Action<T = unknown> {
  type: string;
  payload: T;
}

/**
 * Props for the UserProvider component
 */
export interface UserProviderProps {
  children: ReactNode;
  initial?: UserState;
  initialSessionTimeoutState?: SessionTimeoutState;
}

/**
 * Data structure for form submissions
 */
export interface SubmitData {
  email: string;
  language: string;
  verificationCode: string;
  password: string;
  phone: string;
  verificationType: string;
  firstName: string;
  lastName: string;
}

/**
 * Options for the useSubmit hook
 */
export interface SubmitDataOptions {
  language: string;
  page: string;
  flow: string;
  type: string;
  endpoint: string;
  navigateTo: string;
  onError: (error: Error) => void;
}

/**
 * Generic API error response structure
 */
export interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
      success?: boolean;
    };
    status?: number;
  };
  message?: string;
}

/**
 * Service payload for authentication endpoints
 */
export interface AuthServicePayload {
  userName?: string;
  password?: string;
  trxnId?: string;
  otp?: string;
  otpType?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  id?: string;
  language?: string;
}

/**
 * Generic success response from API
 */
export interface ApiSuccessResponse {
  success: boolean;
  message: string;
  data: unknown;
}

/**
 * FIDO2 credential structure
 */
export interface Fido2Credential {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  lastUsedAt?: string;
}

/**
 * Analytics event tracking data
 */
export interface AnalyticsEvent {
  category: string;
  action: string;
  label: string;
}

/**
 * Component with children prop
 */
export interface WithChildren {
  children: ReactNode;
}

/**
 * Modal component props
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  message?: string;
}

/**
 * Page content from i18n files
 */
export type PageContent = Record<string, string>;

/**
 * Form field validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Phone number structure
 */
export interface PhoneNumber {
  value: string;
  type: string;
}

/**
 * Email structure
 */
export interface Email {
  value: string;
  type: string;
}

/**
 * Wizard step configuration
 */
export interface WizardStep {
  id: string;
  title: string;
  component: React.ComponentType;
  isOptional?: boolean;
}

/**
 * Session status from SSE
 */
export interface SessionStatus {
  status: "active" | "expired" | "terminated";
  expire?: number;
}

/**
 * Route configuration
 */
export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  protected?: boolean;
}
