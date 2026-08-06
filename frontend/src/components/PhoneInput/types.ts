export interface CountryOption {
  iso2: string;
  dialCode: string;
  countryName: string;
  label: string;
}

export interface PhoneInputChangePayload {
  storedPhoneNumber: string;
  formattedPhoneNumber: string;
  isValid: boolean;
}

export interface CountryPhoneInputProps {
  language?: string;
  storedPhoneNumber: string;
  variant: "contact" | "mfa";
  optionIdPrefix: string;
  inputId: string;
  inputName?: string;
  labels: {
    country: string;
    countrySearch: string;
    countryNotSupported: string;
    phone: string;
  };
  onChange: (payload: PhoneInputChangePayload) => void;
}
