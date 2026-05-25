import type { UserProfile } from "./user";
import type { FlowType } from "./utils";

export type ContactPhoneDisplayEntry = {
  value: string;
  type: string;
};

export type ContactPhoneWizardStep =
  | "enterPhone"
  | "verifyOtp"
  | "confirmUpdate"
  | "success";

export type ContactPhoneOtpType = Extract<FlowType, "smsotp" | "voiceotp">;

export type ContactPhoneFormData = {
  phoneNumber: string;
  otp: string;
  trxnId: string;
  otpType: ContactPhoneOtpType;
  formattedPhoneNumber: string;
};

export type ContactPhoneField = keyof ContactPhoneFormData;

export type ContactPhonePageContent = Record<string, string>;

export type ContactPhoneTransactionData = {
  trxnId: string;
};

export type ContactPhoneFormChangeHandler = <TField extends ContactPhoneField>(
  field: TField,
  value: ContactPhoneFormData[TField],
) => void;

export type ContactPhoneErrorCodeSetter = (errorCode: string) => void;

export type ContactPhoneAsyncAction = () => void | Promise<void>;

export type ContactPhoneOtpRequestHandler = (
  otpType?: ContactPhoneOtpType,
) => void | Promise<void>;

export type ContactPhoneStepProps = {
  userProfile?: UserProfile | null;
  phoneFormData: ContactPhoneFormData;
  errorMessage?: string;
  onNext: ContactPhoneAsyncAction;
  onCancel: ContactPhoneAsyncAction;
  onChangePhoneForm: ContactPhoneFormChangeHandler;
  setErrorCode?: ContactPhoneErrorCodeSetter;
};

export type ContactPhoneOtpVerificationProps = ContactPhoneStepProps & {
  onBack: ContactPhoneAsyncAction;
  requestNewOtpCode: ContactPhoneOtpRequestHandler;
  isMaxAttemptsReached?: boolean;
  resetAttempts?: () => void;
};

export type ContactPhoneConfirmUpdateProps = ContactPhoneStepProps & {
  localLoading?: boolean;
};

export type ContactPhoneSuccessProps = Pick<
  ContactPhoneStepProps,
  "onNext" | "onCancel" | "phoneFormData"
> & {
  phoneFormData?: ContactPhoneFormData;
};

export type ContactPhoneDisplayProps = {
  pageContent: ContactPhonePageContent;
  contactNumber: string | null;
};

export type ContactPhoneSectionProps = {
  pageContent: ContactPhonePageContent;
  language?: string;
};

export type ContactPhoneDisplaySectionProps = ContactPhoneSectionProps & {
  phoneNumbers: ContactPhoneDisplayEntry[];
};

export type GcdsNavigationEvent = CustomEvent<string> & {
  preventDefault: () => void;
};
