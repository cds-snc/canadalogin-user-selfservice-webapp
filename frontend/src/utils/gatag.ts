import ReactGA from "react-ga4";

import { GA_CATEGORIES, GA_CLICK_EVENTS } from "./analyticsConstants";
import type {
  AnalyticsPayload,
  AnalyticsTrackEvent,
  GA4EventParams,
  CardClickParams,
} from "../types/utils";

const GA_PAGE_TITLE_SUFFIXES: Record<string, string> = {
  ManageDashboard: "Dashboard",
  ProfileHome: "ProfileHome",
  EditProfileNamePage: "Name Change - Step 1: Edit your name",
  ProfileUpdateNameConfirmUpdate: "Name Change - Step 2: Confirm name change",
  ProfileUpdateNameSuccess: "Name Change - Step 3: Name updated",
  EditLanguagePreferences: "Language Change - Step 1: Choose language",
  ConfirmLanguageUpdate: "Language Change - Step 2: Confirm language",
  SuccessfullyUpdatedLanguage: "Language Change - Step 3: Language updated",
  EditContactPhoneNumberPage:
    "Phone Number Change - Step 1: Enter new phone number",
  PhoneChangeVerifyOtp: "Phone Number Change - Step 2: Verify phone number",
  PhoneChangeConfirmUpdate:
    "Phone Number Change - Step 3: Confirm number change",
  PhoneChangeSuccess: "Phone Number Change - Step 4: Number updated",
  EditEmailPage: "Email Change - Step 1: Verify it's you",
  EmailChangeOtpSelection: "Email Change - Step 2: Choose verification method",
  EmailChangeOtpValidation: "Email Change - Step 3: Enter verification code",
  EmailChangeEnterEmail: "Email Change - Step 4: Enter new email",
  EmailChangeVerifyNewEmail: "Email Change - Step 5: Verify new email",
  EmailChangeConfirmUpdate: "Email Change - Step 6: Confirm email change",
  EmailChangeSuccess: "Email Change - Step 7: Email updated",
  PasswordChangeVerifyIdentity: "Password Change - Step 1: Verify it's you",
  PasswordChangeOtpSelection:
    "Password Change - Step 2: Choose verification method",
  PasswordChangeOtpValidation:
    "Password Change - Step 3: Enter verification code",
  PasswordChangeEnterNewPassword:
    "Password Change - Step 4: Enter new password",
  PasswordChangeSuccess: "Password Change - Step 5: Password changed",
  AddPhoneNumberVerifyIdentity: "Add Phone Number - Step 1: Verify it's you",
  AddPhoneNumberOtpSelection:
    "Add Phone Number - Step 2: Choose verification method",
  AddPhoneNumberOtpValidation:
    "Add Phone Number - Step 3: Enter verification code",
  AddPhoneNumberEnterNumber: "Add Phone Number - Step 4: Enter phone number",
  AddPhoneNumberVerifyNumber: "Add Phone Number - Step 5: Verify phone number",
  AddPhoneNumberSecondMethod: "Add Phone Number - Step 6: Set up backup method",
  DeletePhoneNumberVerifyIdentity:
    "Delete Phone Number - Step 1: Verify it's you",
  DeletePhoneNumberOtpSelection:
    "Delete Phone Number - Step 2: Choose verification method",
  DeletePhoneNumberOtpValidation:
    "Delete Phone Number - Step 3: Enter verification code",
  DeletePhoneNumberConfirm:
    "Delete Phone Number - Step 4: Confirm number removal",
  SecuritySettings: "SecuritySettings",
  Password: "Password Change - Step 1: Verify it's you",
  Manage2FAVerifications: "Manage2FAVerifications",
  AddMFAPage: "Add Phone Number - Step 1: Verify it's you",
  DeleteMFAPage: "Delete Phone Number - Step 1: Verify it's you",
  AddFIDO2PasskeyPage: "AddPasskey",
  DeleteFIDO2PasskeyPage: "DeletePasskey",
};

function toTitleCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getAnalyticsPageTitle(path: string, pageId?: string) {
  const pathSuffix = path.split("/").filter(Boolean).slice(1).join(" ");

  const mappedTitle = pageId ? GA_PAGE_TITLE_SUFFIXES[pageId] : undefined;
  if (mappedTitle) {
    return mappedTitle;
  }

  const suffixSource = (pageId ?? pathSuffix) || "Home";

  return toTitleCase(suffixSource);
}

export function trackPage(path: string, pageId?: string) {
  const title = getAnalyticsPageTitle(path, pageId);

  if (typeof document !== "undefined") {
    document.title = title;
  }

  ReactGA.send({ hitType: GA_CATEGORIES.pageView, page: path, title });
}

export function trackEvent({ category, action, label }: AnalyticsPayload) {
  ReactGA.event({ category, action, label });
}
export function trackGA4Event(eventName: string, params?: GA4EventParams) {
  ReactGA.event(eventName, params);
}

export function trackAnalyticsEvent({
  event,
  form_id,
  step,
  type,
  error,
  duration_ms,
}: AnalyticsTrackEvent) {
  const params: GA4EventParams = {
    form_id,
    step,
    page: typeof document !== "undefined" ? document.title : undefined,
  };
  if (type !== undefined) {
    params.type = type;
  }
  if (error !== undefined) {
    params.error = error;
  }
  if (duration_ms !== undefined) {
    params.duration_ms = duration_ms;
  }
  ReactGA.event(event, params);
}

export function trackCardClick(params: CardClickParams) {
  trackGA4Event(GA_CLICK_EVENTS.CARD_CLICK, params);
}

export function trackButtonClick(
  buttonName: string,
  additionalParams?: GA4EventParams,
) {
  trackGA4Event(GA_CLICK_EVENTS.BUTTON_CLICK, {
    button_name: buttonName,
    ...additionalParams,
  });
}
