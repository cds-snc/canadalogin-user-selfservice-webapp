import ReactGA from "react-ga4";

import { GA_CLICK_EVENTS } from "./analyticsConstants";
import config from "../config";
import type {
  AnalyticsPayload,
  AnalyticsTrackEvent,
  GA4EventParams,
  CardClickParams,
} from "../types/utils";

const CommonPages = {
  ManageDashboard: "Dashboard",
  ProfileHome: "ProfileHome",
  SecuritySettings: "SecuritySettings",
  Manage2FAVerifications: "Manage2FAVerifications",
};

const ProfileNameSteps = {
  EditProfileNamePage: "Name Change - Step 1: Edit your name",
  ProfileUpdateNameConfirmUpdate: "Name Change - Step 2: Confirm name change",
  ProfileUpdateNameSuccess: "Name Change - Step 3: Name updated",
};

const LanguageChangeSteps = {
  EditLanguagePreferences: "Language Change - Step 1: Choose language",
  ConfirmLanguageUpdate: "Language Change - Step 2: Confirm language",
  SuccessfullyUpdatedLanguage: "Language Change - Step 3: Language updated",
};

const PhoneChangeSteps = {
  EditContactPhoneNumberPage:
    "Phone Number Change - Step 1: Enter new phone number",
  PhoneChangeVerifyOtp: "Phone Number Change - Step 2: Verify phone number",
  PhoneChangeConfirmUpdate:
    "Phone Number Change - Step 3: Confirm number change",
  PhoneChangeSuccess: "Phone Number Change - Step 4: Number updated",
};

const EmailChangeSteps = {
  EditEmailPage: "Email Change - Step 1: Verify it's you",
  EmailChangeOtpSelection: "Email Change - Step 2: Choose verification method",
  EmailChangeOtpValidation: "Email Change - Step 3: Enter verification code",
  EmailChangeEnterEmail: "Email Change - Step 4: Enter new email",
  EmailChangeVerifyNewEmail: "Email Change - Step 5: Verify new email",
  EmailChangeConfirmUpdate: "Email Change - Step 6: Confirm email change",
  EmailChangeSuccess: "Email Change - Step 7: Email updated",
};

const PasswordChangeSteps = {
  Password: "Password Change - Step 1: Verify it's you",
  PasswordChangeVerifyIdentity: "Password Change - Step 1: Verify it's you",
  PasswordChangeOtpSelection:
    "Password Change - Step 2: Choose verification method",
  PasswordChangeOtpValidation:
    "Password Change - Step 3: Enter verification code",
  PasswordChangeEnterNewPassword:
    "Password Change - Step 4: Enter new password",
  PasswordChangeSuccess: "Password Change - Step 5: Password changed",
};

const AddPhoneNumberSteps = {
  AddMFAPage: "Add Phone Number - Step 1: Verify it's you",
  AddPhoneNumberVerifyIdentity: "Add Phone Number - Step 1: Verify it's you",
  AddPhoneNumberOtpSelection:
    "Add Phone Number - Step 2: Choose verification method",
  AddPhoneNumberOtpValidation:
    "Add Phone Number - Step 3: Enter verification code",
  AddPhoneNumberEnterNumber: "Add Phone Number - Step 4: Enter phone number",
  AddPhoneNumberVerifyNumber: "Add Phone Number - Step 5: Verify phone number",
  AddPhoneNumberSecondMethod: "Add Phone Number - Step 6: Set up backup method",
};

const DeletePhoneNumberSteps = {
  DeleteMFAPage: "Delete Phone Number - Step 1: Verify it's you",
  DeletePhoneNumberVerifyIdentity:
    "Delete Phone Number - Step 1: Verify it's you",
  DeletePhoneNumberOtpSelection:
    "Delete Phone Number - Step 2: Choose verification method",
  DeletePhoneNumberOtpValidation:
    "Delete Phone Number - Step 3: Enter verification code",
  DeletePhoneNumberConfirm:
    "Delete Phone Number - Step 4: Confirm number removal",
};

const AddPasskeySteps = {
  AddFIDO2PasskeyPage: "Add Passkey",
  AddPasskeyVerifyIdentity: "Add Passkey - Step 1: Verify it's you",
  AddPasskeyOtpSelection: "Add Passkey - Step 2: Choose verification method",
  AddPasskeyOtpValidation: "Add Passkey - Step 3a: Enter verification code",
  AddPasskeyVerifyPasskey:
    "Add Passkey - Step 3b: Verify with existing passkey",
  AddPasskeyRegister: "Add Passkey - Step 4: Register passkey",
  AddPasskeySetNickname: "Add Passkey - Step 5: Name your passkey",
};

const DeletePasskeySteps = {
  DeleteFIDO2PasskeyPage: "Delete Passkey",
  DeletePasskeyVerifyIdentity: "Delete Passkey - Step 1: Verify it's you",
  DeletePasskeyOtpSelection:
    "Delete Passkey - Step 2: Choose verification method",
  DeletePasskeyOtpValidation:
    "Delete Passkey - Step 3a: Enter verification code",
  DeletePasskeyVerifyPasskey:
    "Delete Passkey - Step 3b: Verify with existing passkey",
  DeletePasskeyConfirm: "Delete Passkey - Step 4: Confirm removal",
  DeletePasskeySuccess: "Delete Passkey - Step 5: Passkey deleted",
};

const RenamePasskeySteps = {
  RenamePasskeyEdit: "Rename Passkey - Step 1: Name your passkey",
  RenamePasskeySuccess: "Rename Passkey - Step 2: Passkey renamed",
};

const GA_PAGE_TITLE_SUFFIXES: Record<string, string> = {
  ...CommonPages,
  ...ProfileNameSteps,
  ...LanguageChangeSteps,
  ...PhoneChangeSteps,
  ...EmailChangeSteps,
  ...PasswordChangeSteps,
  ...AddPhoneNumberSteps,
  ...DeletePhoneNumberSteps,
  ...AddPasskeySteps,
  ...DeletePasskeySteps,
  ...RenamePasskeySteps,
};

function withCommonAnalyticsParams(params?: GA4EventParams): GA4EventParams {
  return {
    ...params,
    app_environment: config.environment,
  };
}

function toTitleCase(value?: string) {
  if (!value) {
    return "";
  }

  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getAnalyticsPageTitle(path?: string, pageId?: string) {
  const safePath = typeof path === "string" && path.trim() ? path : "/";
  const pathSuffix = safePath.split("/").filter(Boolean).slice(1).join(" ");

  const mappedTitle = pageId ? GA_PAGE_TITLE_SUFFIXES[pageId] : undefined;
  if (mappedTitle) {
    return mappedTitle;
  }

  const suffixSource = (pageId ?? pathSuffix) || "Home";

  return toTitleCase(suffixSource);
}

export function trackPage(
  path?: string,
  pageId?: string,
  additionalParams?: GA4EventParams,
) {
  const safePath = typeof path === "string" && path.trim() ? path : "/";
  const title = getAnalyticsPageTitle(safePath, pageId);

  const payload: GA4EventParams = {
    ...additionalParams,
    page_title: title,
    page_path: safePath,
    page_location:
      typeof window !== "undefined" ? window.location.href : undefined,
  };

  ReactGA.event("page_view", withCommonAnalyticsParams(payload));
}

export function setAnalyticsContext(additionalParams?: GA4EventParams) {
  ReactGA.set(withCommonAnalyticsParams(additionalParams));
}

export function trackEvent({ category, action, label }: AnalyticsPayload) {
  ReactGA.event(
    action,
    withCommonAnalyticsParams({
      event_category: category,
      ...(label && { event_label: label }),
    }),
  );
}
export function trackGA4Event(eventName: string, params?: GA4EventParams) {
  ReactGA.event(eventName, withCommonAnalyticsParams(params));
}

export function trackAnalyticsEvent(
  { event, form_id, step, type, error, duration_ms }: AnalyticsTrackEvent,
  additionalParams?: GA4EventParams,
) {
  const reservedKeys = new Set([
    "form_id",
    "step",
    "page",
    "type",
    "error",
    "duration_ms",
  ]);
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
  if (additionalParams) {
    const safeAdditionalParams = Object.fromEntries(
      Object.entries(additionalParams).filter(
        ([key]) => !reservedKeys.has(key),
      ),
    ) as GA4EventParams;

    Object.assign(params, safeAdditionalParams);
  }
  ReactGA.event(event, withCommonAnalyticsParams(params));
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
