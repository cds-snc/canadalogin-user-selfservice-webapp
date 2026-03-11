import type { AppLanguage } from "./utils";

export type LanguagePreferenceWizardStep =
  | "editLanguage"
  | "confirmUpdate"
  | "success";

export type LanguagePreferencePageContent = Record<string, string>;

export type LanguagePreferenceFormData = {
  updatedPreferredLanguage: string;
  languageCode: AppLanguage | "";
};

export type LanguagePreferenceAsyncAction = () => void | Promise<void>;

export type LanguagePreferenceChangeHandler = (
  updatedPreferredLanguage: string,
) => void;

export type LanguagePreferenceErrorCodeSetter = (errorCode: string) => void;

export type LanguagePreferenceEditProps = {
  languageFormData: LanguagePreferenceFormData;
  onLanguageFormChange: LanguagePreferenceChangeHandler;
  onNext: LanguagePreferenceAsyncAction;
  onCancel: LanguagePreferenceAsyncAction;
  errorMessage?: string;
  setErrorCode?: LanguagePreferenceErrorCodeSetter;
};

export type LanguagePreferenceConfirmProps = {
  languageFormData?: LanguagePreferenceFormData;
  onConfirm: LanguagePreferenceAsyncAction;
  onCancel: LanguagePreferenceAsyncAction;
  errorMessage?: string;
  setErrorCode?: LanguagePreferenceErrorCodeSetter;
  localLoading?: boolean;
};

export type LanguagePreferenceSuccessProps = {
  languageFormData?: LanguagePreferenceFormData;
  onBackToProfile: LanguagePreferenceAsyncAction;
};

export type LanguagePreferenceViewProps = {
  pageContent: LanguagePreferencePageContent;
};

export type GcdsNavigationEvent = CustomEvent<string> & {
  preventDefault: () => void;
};
