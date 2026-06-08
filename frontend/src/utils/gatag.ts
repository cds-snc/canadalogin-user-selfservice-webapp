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
  EditProfileNamePage: "Name Change - Edit your name",
  ProfileUpdateNameConfirmUpdate: "Name Change - Confirm name change",
  ProfileUpdateNameSuccess: "Name Change - Name updated",
};

const LanguageChangeSteps = {
  EditLanguagePreferences: "Language Change - Choose language",
  ConfirmLanguageUpdate: "Language Change - Confirm language",
  SuccessfullyUpdatedLanguage: "Language Change - Language updated",
};

const PhoneChangeSteps = {
  EditContactPhoneNumberPage: "Phone Number Change - Enter new phone number",
  PhoneChangeVerifyOtp: "Phone Number Change - Verify phone number",
  PhoneChangeConfirmUpdate: "Phone Number Change - Confirm number change",
  PhoneChangeSuccess: "Phone Number Change - Number updated",
};

const EmailChangeSteps = {
  EditEmailPage: "Email Change - Verify it's you",
  EmailChangeOtpSelection: "Manage - 2 step verification method",
  EmailChangeOtpValidation: "Manage – Initiate 2-step verification",
  EmailChangeEnterEmail: "Email Change - Enter new email",
  EmailChangeVerifyNewEmail: "Email Change - Verify new email",
  EmailChangeConfirmUpdate: "Email Change - Confirm email change",
  EmailChangeSuccess: "Email Change - Email updated",
};

const PasswordChangeSteps = {
  Password: "Password Change - Verify it's you",
  PasswordChangeVerifyIdentity: "Password Change - Verify it's you",
  PasswordChangeOtpSelection: "Manage - 2 step verification method",
  PasswordChangeOtpValidation: "Manage - Initiate 2-step verification",
  PasswordChangeEnterNewPassword: "Password Change - Enter new password",
  PasswordChangeSuccess: "Password Change - Password changed",
};

const AddPhoneNumberSteps = {
  AddMFAPage: "Add Phone Number - Verify it's you",
  AddPhoneNumberVerifyIdentity: "Add Phone Number - Verify it's you",
  AddPhoneNumberOtpSelection: "Manage - 2 step verification method",
  AddPhoneNumberOtpValidation: "Manage - Initiate 2-step verification",
  AddPhoneNumberEnterNumber: "Add Phone Number - Enter phone number",
  AddPhoneNumberVerifyNumber: "Add Phone Number - Verify phone number",
  AddPhoneNumberSecondMethod: "Add Phone Number - Set up backup method",
};

const DeletePhoneNumberSteps = {
  DeleteMFAPage: "Delete Phone Number - Verify it's you",
  DeletePhoneNumberVerifyIdentity: "Delete Phone Number - Verify it's you",
  DeletePhoneNumberOtpSelection: "Manage - 2 step verification method",
  DeletePhoneNumberOtpValidation: "Manage - Initiate 2-step verification",
  DeletePhoneNumberConfirm: "Delete Phone Number - Confirm number removal",
};

const AddPasskeySteps = {
  AddFIDO2PasskeyPage: "Add Passkey",
  AddPasskeyVerifyIdentity: "Add Passkey - Verify it's you",
  AddPasskeyOtpSelection: "Manage - 2 step verification method",
  AddPasskeyOtpValidation: "Manage - Initiate 2-step verification",
  AddPasskeyVerifyPasskey: "Add Passkey - Verify with existing passkey",
  AddPasskeyRegister: "Add Passkey - Register passkey",
  AddPasskeySetNickname: "Add Passkey - Name your passkey",
};

const DeletePasskeySteps = {
  DeleteFIDO2PasskeyPage: "Delete Passkey",
  DeletePasskeyVerifyIdentity: "Delete Passkey - Verify it's you",
  DeletePasskeyOtpSelection: "Manage - 2 step verification method",
  DeletePasskeyOtpValidation: "Manage - Initiate 2-step verification",
  DeletePasskeyVerifyPasskey: "Delete Passkey - Verify with existing passkey",
  DeletePasskeyConfirm: "Delete Passkey - Confirm removal",
  DeletePasskeySuccess: "Delete Passkey - Passkey deleted",
};

const RenamePasskeySteps = {
  RenamePasskeyEdit: "Rename Passkey - Name your passkey",
  RenamePasskeySuccess: "Rename Passkey - Passkey renamed",
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
  { event, form_id, step, type, flow, error, duration_ms }: AnalyticsTrackEvent,
  additionalParams?: GA4EventParams,
) {
  const reservedKeys = new Set([
    "form_id",
    "step",
    "page",
    "type",
    "flow",
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
  if (flow !== undefined) {
    params.flow = flow;
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
