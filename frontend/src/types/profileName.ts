import type { AppLanguage } from "./utils";

export type ProfileNameWizardStep = "editName" | "confirmUpdate" | "success";

export type ProfileNamePageContent = Record<string, string>;

export type ProfileNameFormData = {
  givenName: string;
  familyName: string;
  formatted: string;
};

export type ProfileNameField = keyof ProfileNameFormData;

export type EditableProfileNameField = Extract<
  ProfileNameField,
  "givenName" | "familyName"
>;

export type ProfileNameAsyncAction = () => void | Promise<void>;

export type ProfileNameChangeHandler = <TField extends ProfileNameField>(
  field: TField,
  value: ProfileNameFormData[TField],
) => void;

export type ProfileNameErrorCodeSetter = (errorCode: string) => void;

export type ProfileNameEditProps = {
  nameFormData: ProfileNameFormData;
  onNameFormChange: ProfileNameChangeHandler;
  onNext: ProfileNameAsyncAction;
  onCancel: ProfileNameAsyncAction;
  errorMessage?: string;
  setErrorCode?: ProfileNameErrorCodeSetter;
};

export type ProfileNameConfirmProps = {
  nameFormData?: ProfileNameFormData;
  onConfirm: ProfileNameAsyncAction;
  onCancel: ProfileNameAsyncAction;
  onBack?: ProfileNameAsyncAction;
  errorMessage?: string;
  setErrorCode?: ProfileNameErrorCodeSetter;
  localLoading?: boolean;
};

export type ProfileNameSuccessProps = {
  nameFormData?: ProfileNameFormData | null;
  onBackToProfile: ProfileNameAsyncAction;
};

export type ProfileNameViewProps = {
  pageContent: ProfileNamePageContent;
};

export type ProfileNameRouteLanguage = AppLanguage;

export type GcdsNavigationEvent = CustomEvent<string> & {
  preventDefault: () => void;
};
