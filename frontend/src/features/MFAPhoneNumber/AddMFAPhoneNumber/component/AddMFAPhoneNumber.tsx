import {
  GcdsButton,
  GcdsContainer,
  GcdsDetails,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsRadios,
  GcdsText,
} from "@gcds-core/components-react";
import { isValidPhoneNumber, CountryCode } from "libphonenumber-js";
import { useEffect, useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";
import { useParams } from "react-router";
import {
  countryMapping,
  EXTERNAL_NAVIGATION_LINKS,
  FLOW_TYPES,
  PAGES,
} from "../../../../utils/constants";
import { useTranslation } from "react-i18next";
import { path } from "../../../../utils/routeHelpers";
import SubmitButton from "../../../../components/Layout/SubmitButton";
import type { ReactElement } from "react";
import {
  getDisplayedPhoneNumber,
  getStoredPhoneNumber,
} from "../../../../utils/mfaPhoneNumber";

type PhoneInputCountryData = {
  countryCode?: string;
  dialCode?: string;
  iso2?: string;
};

type PhoneInputChangeEvent = Event | React.ChangeEvent<HTMLInputElement>;

interface TypedPhoneInputProps {
  inputProps?: Record<string, unknown>;
  specialLabel?: string;
  country?: string;
  preferredCountries?: string[];
  onlyCountries?: string[];
  className?: string;
  localization?: Record<string, string>;
  value?: string;
  placeholder?: string;
  enableSearch?: boolean;
  disableCountryCode?: boolean;
  disableCountryGuess?: boolean;
  countryCodeEditable?: boolean;
  disableSearchIcon?: boolean;
  defaultErrorMessage?: string;
  onChange?: (
    phone: string,
    country: PhoneInputCountryData,
    event: PhoneInputChangeEvent,
    formattedValue: string,
  ) => void;
  isValid?: (inputNumber: string, country: PhoneInputCountryData) => boolean;
}

const TypedPhoneInput = PhoneInput as unknown as (
  props: TypedPhoneInputProps,
) => ReactElement;

const getFormattedPhoneNumber = (
  formattedPhoneNumber: string,
  dialCode: string,
) => {
  const trimmedFormattedPhoneNumber = formattedPhoneNumber.trim();

  if (!trimmedFormattedPhoneNumber) {
    return "";
  }

  if (trimmedFormattedPhoneNumber.startsWith("+")) {
    return trimmedFormattedPhoneNumber;
  }

  return `+${dialCode} ${trimmedFormattedPhoneNumber}`;
};

interface PhoneFormData {
  phoneNumber: string;
  otp: string;
  mfaId: string;
  trxnId: string;
  otpType: string;
  formattedPhoneNumber: string;
}

interface RadioOption {
  label: string;
  id: string;
  value: string;
  hint: string;
  checked: boolean;
}

interface RadioButtonsProps {
  onChangePhoneForm: (field: string, value: string) => void;
  phoneFormData: PhoneFormData;
}

const RadioButtons = ({
  onChangePhoneForm,
  phoneFormData,
}: RadioButtonsProps) => {
  const { t } = useTranslation("mfa");
  // Set up radio buttons
  const configureRadioOptions = (): RadioOption[] => {
    const radioOptionsValues: RadioOption[] = [];

    const smsLabel = `${t("AddMFANumber.textMessage")}`;
    const smsOtpRadioOption: RadioOption = {
      label: smsLabel,
      id: `sms-radio-${FLOW_TYPES.sms}`,
      value: FLOW_TYPES.sms,
      hint: t("AddMFANumber.textMessageHint"),
      checked: phoneFormData.otpType === FLOW_TYPES.sms,
    };
    radioOptionsValues.push(smsOtpRadioOption);

    const voiceLabel = `${t("AddMFANumber.voiceCall")}`;
    const voiceOtpRadioOption: RadioOption = {
      label: voiceLabel,
      id: `voice-radio-${FLOW_TYPES.voice}`,
      value: FLOW_TYPES.voice,
      hint: t("AddMFANumber.voiceCallHint"),
      checked: phoneFormData.otpType === FLOW_TYPES.voice,
    };
    radioOptionsValues.push(voiceOtpRadioOption);

    return radioOptionsValues;
  };

  const radioOptions = configureRadioOptions();
  return (
    <GcdsRadios
      name="radio"
      legend={t("AddMFANumber.howToSendCode")}
      hint={t("AddMFANumber.changeNextSignIn")}
      options={radioOptions}
      required={true}
      onGcdsChange={(e: CustomEvent<string>) => {
        onChangePhoneForm("otpType", (e.target as HTMLInputElement).value);
      }}
    ></GcdsRadios>
  );
};

interface MyCountryIsNotListedProps {}

const MyCountryIsNotListed = ({}: MyCountryIsNotListedProps) => {
  const { t } = useTranslation("mfa");
  return (
    <GcdsText>
      <GcdsDetails detailsTitle={t("AddMFANumber.countryNotListed")}>
        <GcdsText>
          <span>{t("AddMFANumber.countryNotSupported")}</span>
        </GcdsText>
      </GcdsDetails>
    </GcdsText>
  );
};

interface AddMFAPhoneNumberProps {
  onNext: () => Promise<void>;
  onCancel: () => Promise<void>;
  onChangePhoneForm: (field: string, value: string) => void;
  phoneFormData: PhoneFormData;
  setErrorCode: (code: string) => void;
  errorMessage: string;
}

export default function AddMFAPhoneNumber({
  onNext,
  onCancel,
  onChangePhoneForm,
  phoneFormData,
  setErrorCode,
  errorMessage,
}: AddMFAPhoneNumberProps) {
  const { language } = useParams();
  const [phoneNumberValid, setPhoneNumberValid] = useState(true);
  const [selectedDialCode, setSelectedDialCode] = useState("1");
  const [displayedPhoneNumber, setDisplayedPhoneNumber] = useState(() =>
    getDisplayedPhoneNumber(phoneFormData.phoneNumber, "1"),
  );
  const { t } = useTranslation(["mfa", "common"]);
  const backtoProfilePage = path(PAGES.ProfileHome, { language: language });
  const privacyNoticeHref =
    language === "fr"
      ? `${EXTERNAL_NAVIGATION_LINKS.CanadaLoginWebsiteProdDomainFR}/utilisateurs/confidentialite/`
      : `${EXTERNAL_NAVIGATION_LINKS.CanadaLoginWebsiteProdDomainEN}/users/privacy/`;

  const isPhoneNumberValid = (phoneNumber: string, country: string) => {
    const capitalize = country.toUpperCase() as CountryCode;
    const validatedPhoneNumber = isValidPhoneNumber(phoneNumber, capitalize);
    return validatedPhoneNumber;
  };

  const doSubmit = async () => {
    try {
      setErrorCode("");
      await onNext();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      if (err?.data?.message) {
        setErrorCode(err.data.message);
      }
    }
  };

  const onSubmitHandler: React.FormEventHandler<HTMLFormElement> = (ev) => {
    ev.preventDefault();
    void doSubmit();
  };

  useEffect(() => {
    setDisplayedPhoneNumber(
      getDisplayedPhoneNumber(phoneFormData.phoneNumber, selectedDialCode),
    );
  }, [phoneFormData.phoneNumber, selectedDialCode]);

  useEffect(() => {
    const addAccessibilityAttributes = () => {
      const countryList = document.querySelector(
        '.country-list[role="listbox"]',
      );

      if (countryList && !countryList.getAttribute("aria-label")) {
        countryList.setAttribute(
          "aria-label",
          t("AddMFANumber.countryListAriaLabel"),
        );
      }
    };

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          addAccessibilityAttributes();
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    addAccessibilityAttributes();

    return () => observer.disconnect();
  }, [t]);

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="500">
        <GcdsContainer>
          <GcdsHeading tag="h1" lang={language}>
            {t("AddMFANumber.title")}
          </GcdsHeading>
          <GcdsText>{t("AddMFANumber.description")}</GcdsText>
          <GcdsText>
            {t("AddMFANumber.onlyFor2Step")}{" "}
            <GcdsLink href={backtoProfilePage}>
              {t("AddMFANumber.personalInformation")}
            </GcdsLink>{" "}
            {t("AddMFANumber.period")}
          </GcdsText>
          <GcdsText>
            {t("AddMFANumber.privacyNoticeLead")}{" "}
            <GcdsLink href={privacyNoticeHref}>
              {t("AddMFANumber.privacyNoticeLink")}
            </GcdsLink>{" "}
            {t("AddMFANumber.privacyNoticeSuffix")}
          </GcdsText>
        </GcdsContainer>

        <section>
          {errorMessage && (
            <GcdsErrorMessage messageId="message-props">
              {errorMessage}
            </GcdsErrorMessage>
          )}
          <form onSubmit={onSubmitHandler}>
            <div
              className="mfa-phone-input"
              data-country-search-label={t("AddMFANumber.countrySearchLabel")}
            >
              <div className="mfa-phone-input__labels" aria-hidden="true">
                <span className="mfa-phone-input__label mfa-phone-input__label--country">
                  {t("AddMFANumber.countryLabel")}
                </span>
                <span className="mfa-phone-input__label">
                  {t("AddMFANumber.phoneLabel")}
                </span>
              </div>

              <div
                className="mfa-phone-input__control-wrap"
                data-country-dial-code={`+${selectedDialCode}`}
              >
                <TypedPhoneInput
                  inputProps={{
                    name: "phone",
                    required: true,
                    autoFocus: true,
                    "aria-label": t("AddMFANumber.phoneLabel"),
                  }}
                  specialLabel={t("AddMFANumber.phoneLabel")}
                  country={"ca"}
                  preferredCountries={["ca"]}
                  onlyCountries={
                    countryMapping.countries as unknown as string[]
                  }
                  className="high-res mfa-phone-input__control"
                  localization={
                    language === "fr"
                      ? countryMapping.frLocalization
                      : countryMapping.localization
                  }
                  value={displayedPhoneNumber}
                  placeholder=""
                  enableSearch={true}
                  disableCountryCode={true}
                  disableCountryGuess={true}
                  countryCodeEditable={true}
                  disableSearchIcon={false}
                  onChange={(
                    phone: string,
                    country: {
                      countryCode?: string;
                      dialCode?: string;
                      iso2?: string;
                    },
                    _event: PhoneInputChangeEvent,
                    formatted: string,
                  ) => {
                    const dialCode = country.dialCode ?? selectedDialCode;
                    const storedPhoneNumber = getStoredPhoneNumber(
                      phone,
                      dialCode,
                    );
                    const nextDisplayedPhoneNumber = getDisplayedPhoneNumber(
                      storedPhoneNumber,
                      dialCode,
                    );

                    setSelectedDialCode(dialCode);
                    setDisplayedPhoneNumber(nextDisplayedPhoneNumber);
                    onChangePhoneForm("phoneNumber", storedPhoneNumber);
                    onChangePhoneForm(
                      "formattedPhoneNumber",
                      storedPhoneNumber
                        ? getFormattedPhoneNumber(formatted, dialCode)
                        : "",
                    );
                    const isNumberValid = isPhoneNumberValid(
                      phone,
                      country.countryCode ?? "",
                    );
                    setPhoneNumberValid(isNumberValid);
                    setErrorCode("");
                  }}
                  isValid={(
                    inputNumber: string,
                    country: { iso2?: string },
                  ) => {
                    return isPhoneNumberValid(inputNumber, country.iso2 ?? "");
                  }}
                />
              </div>
            </div>
          </form>
        </section>

        <section>
          <MyCountryIsNotListed />
          <RadioButtons
            onChangePhoneForm={onChangePhoneForm}
            phoneFormData={phoneFormData}
          />
        </section>
      </GcdsGrid>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          disabled={!phoneNumberValid || !phoneFormData.phoneNumber}
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            void doSubmit();
          }}
          currentLang={language ?? "en"}
        ></SubmitButton>

        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            onCancel();
          }}
        >
          {t("Button.cancel", { ns: "common" })}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
