export type Breakpoints = {
  mobile: boolean;
  tablet: boolean;
};

export type ErrorMap = Record<string, string>;

export type ErrorEntry = {
  heading: unknown;
  errorMsg: string;
};

export type UseErrorReturn = {
  setError: (link: string, errorId: string) => void;
  clearAllErrors: () => void;
  getError: (index: string) => ErrorEntry;
  hasErrors: () => boolean;
};

export type NavigateState = unknown;

export type NavigateHelper = (
  path: string,
  replaceHistory?: boolean,
  state?: NavigateState,
) => void;

export const otpMapTypes = ["lastFourDigits", "fullPhoneNumber"] as const;

export type OtpMapType = (typeof otpMapTypes)[number];

export type OtpFactor = {
  id: string;
  type: string;
  destination: string;
  [key: string]: unknown;
};

export type OtpFactorReference = {
  type: string;
  id: string;
};

export type PhoneFactorsMap = Record<string, string[] | OtpFactorReference[]>;

export type OtpSentData = {
  trxnId: string;
  expiry?: string | null;
  [key: string]: unknown;
};

export type OtpRequestOverride = {
  otpType: string;
  destination: string;
};

export type UseOtpOperationsOptions = {
  userId?: string | null;
  userName?: string | null;
  setErrorCode: (errorCode: string) => void;
  fallbackNavigationPath?: string;
  allowEmptyFactors?: boolean;
  mapType?: OtpMapType | null;
  mfaTrxnId?: string;
};

export type UseOtpValidationSuccess = (response: unknown) => void;

export type UseOtpOperationsReturn = {
  userPhoneFactors: OtpFactor[];
  userSelectedMfaFactor: OtpFactor | null;
  userSelectedMfaFactorRef: React.MutableRefObject<OtpFactor | null>;
  otpSentResponse: OtpSentData | null;
  userOtpValue: string;
  otpLoading: boolean;
  phoneFactorsMap: PhoneFactorsMap;
  setUserPhoneFactors: React.Dispatch<React.SetStateAction<OtpFactor[]>>;
  setUserSelectedMfaFactor: React.Dispatch<
    React.SetStateAction<OtpFactor | null>
  >;
  setOtpSentResponse: React.Dispatch<React.SetStateAction<OtpSentData | null>>;
  setUserOtpValue: React.Dispatch<React.SetStateAction<string>>;
  setOtpLoading: React.Dispatch<React.SetStateAction<boolean>>;
  handleChangeUserMfaSelection: (id: string) => void;
  handleSetUserOtpValue: (value: string) => void;
  requestOtpCode: (
    override?: OtpRequestOverride,
    onError?: (errorCode: string) => void,
  ) => Promise<boolean>;
  validateOtpCode: (
    otpValue: string,
    onSuccess?: UseOtpValidationSuccess,
    overrideOtpType?: string,
    onError?: (errorCode: string) => void,
  ) => Promise<void>;
  fetchUserOtpPhoneFactors: () => Promise<{
    phoneFactors: OtpFactor[];
    phoneFactorsMap: PhoneFactorsMap;
  } | void>;
  createPhoneFactorsMap: (
    phoneFactors: OtpFactor[],
    mapType?: OtpMapType,
  ) => PhoneFactorsMap;
};

export type PasswordValidationSuccessCallback = () => void | Promise<void>;

export type UsePasswordValidationReturn = {
  validatePassword: (
    userPasswordValue: string | null | undefined,
  ) => Promise<void>;
  validatePasswordLoading: boolean;
};

export type Fido2Credential = {
  id: string;
  attributes?: {
    nickname?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type UsePasskeyOperationsOptions = {
  setErrorCode?: (errorCode: string) => void;
  enabled?: boolean;
};

export type UsePasskeyOperationsReturn = {
  fido2Data: Fido2Credential[];
  loading: boolean;
  refetch: () => Promise<void>;
};
