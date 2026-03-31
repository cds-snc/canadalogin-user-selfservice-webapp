export const LANGUAGE_PREFERENCE_ANALYTICS = {
  FLOW_ID: "language_preference_update",

  STEPS: {
    SELECT_LANGUAGE: "select_language",
    CONFIRM_UPDATE: "confirm_update",
    SUCCESS: "language_update_success",
  },
} as const;

export const PROFILE_NAME_ANALYTICS = {
  FLOW_ID: "profile_name_update",

  STEPS: {
    EDIT_NAME: "edit_name",
    CONFIRM_UPDATE: "confirm_update",
    SUCCESS: "profile_update_success",
  },
} as const;

export const ADD_MFA_ANALYTICS = {
  FLOW_ID: "mfa_phone_number",

  STEPS: {
    VERIFY_PASSWORD: "verify_password",
    OTP_SELECTION: "otp_selection",
    OTP_VALIDATION: "otp_validation",
    ENTER_PHONE: "enter_phone_number",
    ENROLL_MFA: "enroll_mfa",
    MFA_OTP: "mfa_otp",
    ADD_SECOND_MFA: "add_second_mfa",
    SUCCESS: "mfa_enroll_success",
  },
} as const;

export const DELETE_MFA_ANALYTICS = {
  FLOW_ID: "delete_mfa_phone_number",

  STEPS: {
    VERIFY_PASSWORD: "verify_password",
    OTP_SELECTION: "otp_selection",
    OTP_VALIDATION: "otp_validation",
    CONFIRM_DELETE: "confirm_delete",
    SUCCESS: "mfa_delete_success",
  },
} as const;

export const CONTACT_PHONE_ANALYTICS = {
  FLOW_ID: "contact_phone_number_update",

  STEPS: {
    ENTER_PHONE: "enter_phone_number",
    VERIFY_OTP: "verify_otp",
    CONFIRM_UPDATE: "confirm_update",
    SUCCESS: "phone_update_success",
  },
} as const;

export const CHANGE_PASSWORD_ANALYTICS = {
  FLOW_ID: "password_change",

  STEPS: {
    VERIFY_PASSWORD: "verify_password",
    OTP_SELECTION: "otp_selection",
    OTP_VALIDATION: "otp_validation",
    CHANGE_PASSWORD: "change_password",
    SUCCESS: "password_changed_success",
    LOGOUT: "logout",
  },
} as const;

export const EMAIL_ADDRESS_ANALYTICS = {
  FLOW_ID: "email_address_update",

  STEPS: {
    VERIFY_PASSWORD: "verify_password",
    OTP_SELECTION: "otp_selection",
    OTP_VALIDATION: "otp_validation",
    ENTER_EMAIL: "enter_email",
    EMAIL_OTP_VALIDATION: "email_otp_validation",
    CONFIRM_UPDATE: "confirm_update",
    SUCCESS: "email_update_success",
    LOGOUT: "logout",
  },
} as const;

export const GA_CATEGORIES = {
  pageView: "pageview",
} as const;

export const GA_CLICK_EVENTS = {
  CARD_CLICK: "card_click",
  BUTTON_CLICK: "button_click",
} as const;

export const GA_FORM_EVENTS = {
  FORM_STEP_START: "form_step_start",
  FORM_STEP_END: "form_step_end",
  FORM_STEP_CHANGE: "form_step_change",
  FORM_STEP_DURATION: "form_step_duration",
  FORM_SUBMIT: "form_submit",
  FORM_SUBMIT_COMPLETE: "form_submit_complete",
} as const;
