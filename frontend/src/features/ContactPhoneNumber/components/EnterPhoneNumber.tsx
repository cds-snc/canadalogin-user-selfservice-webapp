import { useEffect, useState } from "react";
import type { FormEventHandler, ReactElement } from "react";
import { useParams } from "react-router";
import { isValidPhoneNumber } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";

import {
  GcdsButton,
  GcdsContainer,
  GcdsDetails,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsRadios,
  GcdsText,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import {
  countryMapping,
  FLOW_TYPES,
  ServicesWithAccessInfoSectionInformation,
} from "../../../utils/constants";
import ServicesWithAccessInfoSection from "../../../components/InfoBlocks/ServicesWithAccessInfoSection";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type {
  ContactPhoneOtpType,
  ContactPhoneStepProps,
} from "../../../types/contactPhoneNumber";
import { trackButtonClick } from "../../../utils/gatag";

type PhoneInputCountryData = {
  countryCode?: string;
  iso2?: string;
};

type PhoneInputChangeEvent = Event | React.ChangeEvent<HTMLInputElement>;

interface PhoneInputProps {
  inputProps?: Record<string, unknown>;
  specialLabel?: string;
  country?: string;
  preferredCountries?: string[];
  onlyCountries?: string[];
  localization?: Record<string, string>;
  value?: string;
  className?: string;
  enableSearch?: boolean;
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
  props: PhoneInputProps,
) => ReactElement;

interface PageHeaderProps {
  language: string;
}

function PageHeader({ language }: PageHeaderProps) {
  const { t } = useTranslation("phone");
  return (
    <>
      <GcdsHeading tag="h1" lang={language}>
        {t("EnterNewPhoneNumber.title")}
      </GcdsHeading>
      <GcdsText>{t("EnterNewPhoneNumber.description")}</GcdsText>
      <ServicesWithAccessInfoSection
        currentLang={language}
        information={
          ServicesWithAccessInfoSectionInformation.CONTACT_PHONE_NUMBER
        }
      />
    </>
  );
}

function MyCountryIsNotListed() {
  const { t } = useTranslation("phone");
  return (
    <GcdsText>
      <GcdsDetails detailsTitle={t("EnterNewPhoneNumber.countryNotListed")}>
        <GcdsText>
          <span>{t("EnterNewPhoneNumber.countryNotSupported")}</span>
        </GcdsText>
      </GcdsDetails>
    </GcdsText>
  );
}

type RadioOption = {
  label: string;
  id: ContactPhoneOtpType;
  value: ContactPhoneOtpType;
  hint: string;
  checked: boolean;
};

interface RadioButtonsProps {
  onChangePhoneForm: ContactPhoneStepProps["onChangePhoneForm"];
  phoneFormData: ContactPhoneStepProps["phoneFormData"];
  setErrorCode?: ContactPhoneStepProps["setErrorCode"];
}

function RadioButtons({
  onChangePhoneForm,
  phoneFormData,
  setErrorCode,
}: RadioButtonsProps) {
  const { t } = useTranslation("security");
  const radioOptions: RadioOption[] = [
    {
      label: t("OtpSelection.textMessage"),
      id: FLOW_TYPES.sms,
      value: FLOW_TYPES.sms,
      hint: t("OtpSelection.mobileOnly"),
      checked: phoneFormData.otpType === FLOW_TYPES.sms,
    },
    {
      label: t("OtpSelection.voiceCall"),
      id: FLOW_TYPES.voice,
      value: FLOW_TYPES.voice,
      hint: t("OtpSelection.mobileOrLandline"),
      checked: phoneFormData.otpType === FLOW_TYPES.voice,
    },
  ];

  return (
    <GcdsRadios
      name="radio"
      legend={t("OtpSelection.howToSendCode")}
      hint={t("OtpSelection.carrierCharges")}
      options={radioOptions}
      onGcdsChange={(event: Event) => {
        const target = event.target as HTMLInputElement;
        const selectedType = target.value as ContactPhoneOtpType;

        // Track OTP type selection
        trackButtonClick(`otp_type_${selectedType}`, {
          form_id: "contact_phone_number_update",
          selection_type: selectedType,
        });

        onChangePhoneForm("otpType", selectedType);
        setErrorCode?.("");
      }}
    />
  );
}

export default function EnterPhoneNumber({
  onNext,
  onCancel,
  onChangePhoneForm,
  phoneFormData,
  errorMessage,
  setErrorCode,
}: ContactPhoneStepProps) {
  const { language = "en" } = useParams<{ language: string }>();
  const [phoneNumberValid, setPhoneNumberValid] = useState(true);
  const { t } = useTranslation(["phone", "security", "common"]);

  const validatePhoneNumber = (phoneNumber: string, countryCode?: string) => {
    const normalizedCountryCode = countryCode?.toUpperCase();
    if (!normalizedCountryCode) {
      return false;
    }

    return isValidPhoneNumber(
      phoneNumber,
      normalizedCountryCode as CountryCode,
    );
  };

  const onSubmitHandler: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    await onNext();
  };

  const onSubmitClick = (event: CustomEvent<string | void>) => {
    event.preventDefault();
    void onNext();
  };

  useEffect(() => {
    const addAccessibilityAttributes = () => {
      const countryList = document.querySelector(
        '.country-list[role="listbox"]',
      );
      if (countryList && !countryList.getAttribute("aria-label")) {
        countryList.setAttribute("aria-label", "Countries List");
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
  }, []);

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="500">
        <section>
          <PageHeader language={language} />
        </section>

        <form onSubmit={onSubmitHandler}>
          <section>
            {errorMessage ? (
              <GcdsErrorMessage messageId="message-props">
                {errorMessage}
              </GcdsErrorMessage>
            ) : null}{" "}
            <TypedPhoneInput
              inputProps={{
                name: "phone",
                required: true,
                autoFocus: true,
              }}
              specialLabel={t("EnterNewPhoneNumber.phoneLabel")}
              country="ca"
              preferredCountries={["ca"]}
              onlyCountries={countryMapping.countries as unknown as string[]}
              localization={
                language === "fr"
                  ? (countryMapping.frLocalization as Record<string, string>)
                  : (countryMapping.localization as Record<string, string>)
              }
              value={phoneFormData.phoneNumber}
              className="high-res"
              enableSearch
              countryCodeEditable={false}
              disableSearchIcon={false}
              defaultErrorMessage={t("EnterNewPhoneNumber.phoneRequired")}
              onChange={(phone, country, _event, formatted) => {
                onChangePhoneForm("phoneNumber", `+${phone}`);
                onChangePhoneForm("formattedPhoneNumber", formatted);

                const isNumberValid = validatePhoneNumber(
                  phone,
                  country.countryCode,
                );
                setPhoneNumberValid(isNumberValid);
                setErrorCode?.("");
              }}
              isValid={(inputNumber, country) => {
                return validatePhoneNumber(inputNumber, country.iso2);
              }}
            />
          </section>
        </form>

        <section>
          <MyCountryIsNotListed />
          <GcdsHeading tag="h3">
            {t("EnterNewPhoneNumber.verifyNumber")}
          </GcdsHeading>
          <GcdsText>{t("EnterNewPhoneNumber.verifyDescription")}</GcdsText>
          <RadioButtons
            onChangePhoneForm={onChangePhoneForm}
            phoneFormData={phoneFormData}
            setErrorCode={setErrorCode}
          />
        </section>
      </GcdsGrid>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          disabled={!phoneNumberValid || !phoneFormData.phoneNumber}
          style={{ width: "fit-content" }}
          onGcdsClick={onSubmitClick}
          currentLang={language}
        />

        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
          onGcdsClick={(event: Event) => {
            event.preventDefault();
            trackButtonClick("cancel_phone_update", {
              form_id: "contact_phone_number_update",
              step: "enter_phone",
            });
            void onCancel();
          }}
        >
          {t("Button.cancel", { ns: "common" })}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
